import React, { useState, useEffect } from 'react';
import { hot } from 'react-hot-loader';

async function fetchData(url) {
  const response = await fetch(url, { Accept: 'application/json' });
  return response.json();
};

function SearchLocal(props) {
  const [allLocals, setAllLocals] = useState([]);
  const [localsDisplay, setLocalsDisplay] = useState([]);

  URL = '/locals/get/locals';
  // URL2 = 'api/ejemplo';

  useEffect(() => {
    fetchData(URL)
      .then((response) => setAllLocals(response));
  }, []);

  useEffect(() => {
    fetchData(URL)
      .then((response) => setLocalsDisplay(response));
    console.log('alllocals', allLocals);
  }, []);

  const changeInput = (event) => {
    const searchParam = event.target.value.toLowerCase();
    setLocalsDisplay([]);
    if (searchParam.length > 0) {
      setLocalsDisplay(allLocals.filter((local) => (local.name.toLowerCase().includes(searchParam) || local.ubicacion.toLowerCase().includes(searchParam))));
    } else {
      setLocalsDisplay([...allLocals]);
    }

    console.log(localsDisplay);
    console.log(searchParam.length);
  };

  return (
    <div>
      <div className="search-wrapper">
        <input className="search-input" type="text" placeholder="e.g. files.doc" onChange={changeInput} />
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="feather feather-search" viewBox="0 0 24 24">
          <defs />
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </div>
      <div className="tbl-header">
        <table cellPadding="0" cellSpacing="0" border="0">
          <thead>
            <tr>
              <th>Local</th>
              <th>Ubicacion</th>
              <th>Precio</th>
              <th>-</th>
            </tr>
          </thead>
        </table>
      </div>
      <div className="tbl-content">
        <table cellPadding="0" cellSpacing="0" border="0">
          <tbody>
            { localsDisplay.length > 0 && (localsDisplay.map((local, index) => (
              <LocalsInfo key={index} nombre={local.name} ubicacion={local.ubicacion} precio={local.precio} path={'locals/' + local.id + '/pub'} />
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LocalsInfo(props) {
  const { nombre, ubicacion, precio, path } = props;
  return (
    <tr>
      <td>
        {nombre}
      </td>
      <td>
        {ubicacion}
      </td>
      <td>
        {precio}
      </td>
      <td><a href={path}>Ver más</a></td>
    </tr>
  );
}

export default hot(module)(SearchLocal);