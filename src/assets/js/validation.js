function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

document.addEventListener('DOMContentLoaded', () => {
  const payForm = document.querySelector('form');
  const cvvForm = document.querySelector('#cvv');
  const cardNumberForm = document.querySelector('#cardNumber');
  const ownerForm = document.querySelector('#owner');

  payForm.addEventListener('submit', (event) => {
    const payFormField = [
      'owner',
      'cvv',
      'cardNumber',
      'monthExp',
      'yearExp',
    ];
    let isSubmitable = true;
    payFormField.forEach((formFieldId) => {
      const formField = document.getElementById(formFieldId);
      const errorSibling = formField.parentNode.querySelector('.error');
      if (!formField.value) {
        isSubmitable = false;
        formField.setAttribute('class', 'feedback-input-error');
        errorSibling.textContent = 'Este campo es obligatorio';
      }
    });
    if (!isSubmitable) {
      event.preventDefault();
      console.log('Cannot submit form');
    }
  });

  cvvForm.addEventListener('keyup', (element) => {
    const { value } = element.target;
    if (value.length > 3) {
      const errorSibling = element.target.parentNode.querySelector('.error');
      errorSibling.textContent = 'Maximo 3 caracteres';
      document.getElementById('cvv').value = value.slice(0, 3);
    } else if (isNaN(value)) {
      const errorSibling = element.target.parentNode.querySelector('.error');
      errorSibling.textContent = 'Deben ser valores numericos';
      document.getElementById('cvv').value = '';
    } else {
      const errorSibling = element.target.parentNode.querySelector('.error');
      errorSibling.textContent = '';
    }
  });

  cardNumberForm.addEventListener('keyup', (element) => {
    const { value } = element.target;
    if (value.length > 19) {
      const errorSibling = element.target.parentNode.querySelector('.error');
      errorSibling.textContent = 'Maximo 19 caracteres';
      document.getElementById('cardNumber').value = value.slice(0, 19);
    } else if (isNaN(value)) {
      const errorSibling = element.target.parentNode.querySelector('.error');
      errorSibling.textContent = 'Deben ser valores numericos';
      document.getElementById('cardNumber').value = '';
    } else {
      const errorSibling = element.target.parentNode.querySelector('.error');
      errorSibling.textContent = '';
    }
  });

  ownerForm.addEventListener('keyup', (element) => {
    const { value } = element.target;
    if (isNumeric(value)) {
      const errorSibling = element.target.parentNode.querySelector('.error');
      errorSibling.textContent = 'Deben ser valores no numericos';
      document.getElementById('cvv').value = '';
    } else {
      const errorSibling = element.target.parentNode.querySelector('.error');
      errorSibling.textContent = '';
    }
  });
});
