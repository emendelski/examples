import React, { Component } from 'react';

import Navbar from './components/Navbar';
import Header from './components/Header';
import DoughnutChart from './components/Doughnut';
import BarChart from './components/Bars';

import './App.css';

const VOTE = 35;
const VOTE_API = `https://cors-anywhere.herokuapp.com/https://www.etherchain.org/coinvote/poll/${VOTE}/data/json`;
const USERFEEDS_API = `https://api.userfeeds.io/ranking/`;

class App extends Component {

  constructor() {
    super();
    this.state = {
      votes: [],
      groups: {},
      data: [],
      transactions: {},
      hodl: {},
      assets: {},
      age: {}
    };
  }

  componentDidMount() {
    this.fetch();
  }

  async fetch() {
    let response = await fetch(VOTE_API);
    let votes = await response.json();
    let addresses = [];

    let groups = {}

    votes = votes.map(item => {
      let vote = JSON.parse(item.signature);
      let data = vote.msg.split(' - ');
      let answer = data[2];
      (groups[answer] = groups[answer] || []).push(vote.address);
      addresses.push(vote.address);
      return {
        address: vote.address,
        vote: data[2]
      }
    });

    let enhancedResponse = await fetch(USERFEEDS_API, {
      body: JSON.stringify({
        flow: [
          {
            algorithm: 'governance_simple',
            params: {
              identity: addresses
            }
          }
        ]
      }),
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      method: 'POST',
    });

    let enhancedData = await enhancedResponse.json();
    let addrData = {};

    enhancedData.items.map(item => addrData[item.identity] = item)

    let transactions = {};
    let hodl = {};
    let assets = {};
    let age = {};

    Object.keys(groups).forEach(answer => {
      transactions[answer] = (transactions[answer] || 0) + votes.reduce((acc, cv) => {
        let val = (cv.vote === answer ? (addrData[cv.address] || {transfers: 0}).transfers || 0 : 0);
        return acc + val;
      }, 0);

      hodl[answer] = (hodl[answer] || 0) + votes.reduce((acc, cv) => {
        let val = (cv.vote === answer ? (addrData[cv.address] || {hodl: 0}).hodl || 0 : 0);
        return acc + val;
      }, 0);

      assets[answer] = (assets[answer] || 0) + votes.reduce((acc, cv) => {
        let val = (cv.vote === answer ? (addrData[cv.address] || {assets: []}).assets.length || 0 : 0);
        return acc + val;
      }, 0);

      let date = new Date();
      age[answer] = (age[answer] || 0) + votes.reduce((acc, cv) => {
        let val = (cv.vote === answer ? (addrData[cv.address] || {since: 0}).since || 0 : 0);
        return acc + ((date - val) / 1000 / 60 / 60 / 24);
      }, 0);
    })

    this.setState({votes, groups, transactions, hodl, assets, age});
  }

  render() {
    return (
      <div className="App">
        <Navbar />
        <main>
          <Header title="Governance" subtitle="See what are the incentives behind the votes submitted" />

          <div className="container">
            {
              //<Votes votes={this.state.votes}/>
            }

            <section className="governance-section">
              <h2 className="governance-title">Number of Votes</h2>
              <p className="governance-subtitle">
                <a href="https://www.etherchain.org/coinvote/poll/{VOTE}">https://www.etherchain.org</a>
              </p>

              <DoughnutChart data={ Object.keys(this.state.groups).map(answer => this.state.groups[answer].length) }
                             labels={ Object.keys(this.state.groups) } />
            </section>

            <section className="governance-section">
              <h2 className="governance-title">Transactions</h2>
              <p className="governance-subtitle">
                Number of transaction made by addresses voting for given answer
              </p>

              <BarChart data={ Object.values(this.state.transactions) }
                        labels={ Object.keys(this.state.transactions) } />
            </section>

            <section className="governance-section">
              <h2 className="governance-title">Assets<sup>*</sup></h2>
              <p className="governance-subtitle">
                Number of all assets this address ever interacted with. Number of contracts on Ethereum and all of it's testnets.
              </p>

              <DoughnutChart data={ Object.keys(this.state.assets).map(answer => this.state.assets[answer]) }
                             labels={ Object.keys(this.state.assets) } />
            </section>

            <section className="governance-section">
              <h2 className="governance-title">Age<sup>*</sup></h2>
              <p className="governance-subtitle">
                Each address is assigned a number that represents time since first transaction. Score is a cumulative age of voters.
              </p>

              <DoughnutChart data={ Object.keys(this.state.age).map(answer => parseInt(this.state.age[answer], 10)) }
                             labels={ Object.keys(this.state.age) }
                             custom="days" />
            </section>
          </div>
        </main>
      </div>
    );
  }
}

export default App;
