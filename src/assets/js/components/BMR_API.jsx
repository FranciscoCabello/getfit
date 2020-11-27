import React, { useState, useEffect } from 'react';
import { hot } from 'react-hot-loader';

var axios = require("axios").default;

function BMR_API(props) {

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [sexo, setSexo] = useState('m')
  const [BMR, setBMR] = useState('');

  function handleClick() {

    // if (sexo == 'Masculino') {
    //     setSexo('m');
    // }
    // else{
    //     setSexo('w');
    // }

    var options = {
        method: 'POST',
        url: 'https://bmi.p.rapidapi.com/',
        headers: {
          'content-type': 'application/json',
          'x-rapidapi-key': 'd27b6882b6mshf0a4b56af50d11ep17d801jsn12f71da00427',
          'x-rapidapi-host': 'bmi.p.rapidapi.com'
        },
        data: {
          weight: {value: weight, unit: 'kg'},
          height: {value: height, unit: 'cm'},
          sex: sexo,
          age: age
        }
      };
      
    console.log(options);

    axios.request(options).then(function (response) {
        setBMR(response.data.bmr.value);
    }).catch(function (error) {
        console.error(error);
    });
  };

  return (
    <div id='bmr-form'>
        <h3 className="items-table">Consigue tu BMR!</h3>
        <h3 className="items-table">Su BMR es: {BMR}</h3>
        <div className="form-main">
          <div className="form-div">
            <div>
            <div className="field">
              <label for="height">Altura:</label>
              <input type='number' name='height' className="validate[required,custom[onlyLetter],length[0,100]] feedback-input" onChange={(e) => setHeight(e.target.value)} />
            </div>
            <div className="field">
              <label for="weight">Peso:</label>
              <input type='number' name='weight' className="validate[required,custom[onlyLetter],length[0,100]] feedback-input" onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div className="field">
              <label for="age">Edad:</label>
              <input type='number' name='age' className="validate[required,custom[onlyLetter],length[0,100]] feedback-input" onChange={(e) => setAge(e.target.value)} />
            </div>
            <div className="field">
              <label for="sexo">Genero:</label>
              <select name="sexo" className="validate[required,custom[onlyLetter],length[0,100]] feedback-input" value={sexo} onChange={(e) => setSexo(e.target.value)}>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                </select>
            </div>
            <div className="actions">
                <button onClick={handleClick} className="btn-link-accept">Obtener BMR</button>
            </div>
            </div>
          </div>
        </div>
    </div>
  );
}

export default hot(module)(BMR_API);
