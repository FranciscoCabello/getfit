import React, { useState, useEffect } from 'react';
import { hot } from 'react-hot-loader';

async function fetchData(url) {
  const response = await fetch(url, { Accept: 'application/json' });
  return response.json();
};

function LocalsComments(props) {
  const { local_id } = props;
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newTipo, setNewTipo] = useState('Atencion');
  //const number = 10;
  URL = '/locals/' + local_id + '/get/comments';

  useEffect(() => {
    fetchData(URL).then((response) => setComments(response));
  }, []);

  function handleClick() {
    //Llamada a api que crea comentario
    fetch('/requests/' + local_id + '/creating', {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tipo: newTipo,
        comentario: newComment,
        localId: local_id
      })
    })
      .then(res => res.json())
      .then(res => {
        console.log(res.status);
        if (res.status === "success") {
          //setComments([...comments].concat([{comentario: newComment}]));
        }
      })
    //fetchData(URL).then((response) => setComments(response));
    setComments([...comments].concat([{comentario: newComment, tipo: newTipo}]));
    setNewComment('');
    setNewTipo('Atencion');
  };

  return (
    <div class="content-area">
      <div class="content-section-area">
        <div class="items-table">
            <h1 class="items-table">Deja un comentario</h1>
            <div class="form-main">
              <div class="form-div">
                <div class="field">
                  <div class="field">
                    <p>Tipo:</p>
                    <select name="tipo" value={newTipo} class="validate[required,custom[onlyLetter],length[0,100]] feedback-input" onChange={e => setNewTipo(e.target.value)}>
                      <option value="Atencion">Atencion</option>
                      <option value="Disponibilidad">Disponibilidad</option>
                      <option value="Higiene">Higiene</option>
                      <option value="Personal">Personal</option>
                      <option value="Infraestructura">Infraestructura</option>
                      <option value="Seguridad">Seguridad</option>
                      <option value="Ventilacion">Ventilacion</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                  <div class="field">
                    <p>Comentario:</p>
                    <textarea class="form" type="text" class="validate[required,custom[onlyLetter],length[0,500]] feedback-input" name="content" value={newComment} onChange={e => setNewComment(e.target.value)}></textarea>
                  </div>
                  <div class="actions">
                    <button onClick={handleClick} class="btn-link-accept">Aceptar</button>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
      <div class="content-section-area">
        <div class="items-table">
          <h1 class="items-table">Comentarios</h1>
          <div class="tbl-header">
                <table cellpadding="0" cellspacing="0" border="0">
                    <thead>
                        <tr>
                            <th><p>Tipo</p></th>
                            <th><p>Comentario</p></th>
                        </tr>
                    </thead>
                </table>
            </div>
          <div class="tbl-content">
              <table cellpadding="0" cellspacing="0" border="0">
                  <tbody>
                    {comments.map((comment, index) => (
                      <Comment key={index} content={comment.comentario} tipo={comment.tipo}/>
                    ))}
                  </tbody>
              </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Comment(props) {
  const { content, tipo } = props;
  return (
    <tr>
      <td>{tipo}</td>
      <td>{content}</td>
    </tr>
  )
}

export default hot(module)(LocalsComments);