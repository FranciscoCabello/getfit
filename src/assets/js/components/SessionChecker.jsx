import React, { useState, useEffect } from 'react';
import { hot } from 'react-hot-loader';
//import Redirect from "react-router-dom";

function SessionChecker(props) {

  //const { path } = props;
  const { index } = props;
  const [mail, setMail] = useState('');
  const [password, setPassword] = useState('');
  const [userRejected, setUserRejected] = useState(false);
  const [userApproved, setUserApproved] = useState(false);

  function handleClick() {
    //Llamada a api que crea comentario
    console.log('Intentando ingresar..')
    //fetch('/users/loginPost')
    fetch('/users/loginPost', {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: mail,
        password: password,
      })
    })
      .then(res => res.json())
      .then(res => {
        console.log(res);
        if (res[0] === "Success") {
          console.log('ÉXITO EN inicio de sesión..')
          setUserApproved(true);
          //return <Redirect to="/locals"/>;
                
        }
        else{
          setMail('');
          setPassword('');
          setUserRejected(true);
          console.log('Fracaso!');
        }
      })
  };

  const checkEmail = (event) => {
    setMail(event.target.value);
    if (event.target.value.includes('@')) {
      setUserApproved(true);
      setUserRejected(false);
    } else {
      setUserRejected(true);
    }
  }



  return (
        <div class="form-main">
            <div class="form-div">
                <form method='post' action={'/users/loginPost'}>
                    <div className="field">
                        {userRejected ?(<p>Email invalido</p>):(<p></p>)}
                    </div>
                    <div className='field'>
                        <input type='text' name='email' class="validate[required,custom[onlyLetter],length[0,100]] feedback-input" placeholder='example@example.com' value={mail} onChange={checkEmail}/>
                    </div>
                    <div className='field'>
                        <input type='password' type='password' name='password' class="validate[required,custom[onlyLetter],length[0,100]] feedback-input" placeholder='*********' value={password} onChange={e => setPassword(e.target.value)}/>
                    </div>
                    {userApproved ? ( <div className='actions'><input type='submit' value='Aceptar' className="btn-link-accept"/></div>):(<div className='actions'><input type='submit' value='Aceptar' className="btn-link-accept" disabled/></div>)}
                </form>
            </div>
        </div>
  );
}

export default hot(module)(SessionChecker);
