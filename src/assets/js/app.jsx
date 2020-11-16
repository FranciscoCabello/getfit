import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import LocalsComments from './components/LocalsComments';
import SessionChecker from './components/SessionChecker';
import SearchLocal from './components/SearchLocal';

const reactAppContainer = document.getElementById('react-app');

if (reactAppContainer) {
  ReactDOM.render(<App />, reactAppContainer);
}

const reactLocalsCommentsContainer = document.getElementById('localscomments-app');

if (reactLocalsCommentsContainer) {
  const local_id = reactLocalsCommentsContainer.getAttribute("local_id");
  ReactDOM.render(<LocalsComments local_id={local_id}/>, reactLocalsCommentsContainer);
}

const reactSessionChecker = document.getElementById("session-check-react");

if (reactSessionChecker) {
  const index = reactSessionChecker.getAttribute("action");
  ReactDOM.render(<SessionChecker  index={index}/>, reactSessionChecker);
}

const reactLocalSearch = document.getElementById("react-local-search");

if (reactLocalSearch) {
  ReactDOM.render(<SearchLocal />, reactLocalSearch);
}