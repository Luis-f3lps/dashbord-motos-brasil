document.getElementById('login-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const email = document.querySelector('input[name="email"]').value;
    const senha = document.querySelector('input[name="senha"]').value;

    // Atualizado para chamar a API Serverless
    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
    })
        .then(response => response.json())
        .then(data => {
            const errorMessage = document.getElementById('error-message');
            if (data.success) {
                // Redireciona para o admin após sucesso
                window.location.href = '/admin';
            } else {
                errorMessage.innerText = data.error;
                errorMessage.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Erro ao fazer login:', error);
            const errorMessage = document.getElementById('error-message');
            errorMessage.innerText = 'Erro ao se conectar ao servidor.';
            errorMessage.style.display = 'block';
        });
});

let password = document.getElementById('password');
let togglePassword = document.getElementById('toggle');

function showHide() {
    if (password.type === 'password') {
        password.setAttribute('type', 'text');
        togglePassword.classList.add('hide');
    } else {
        password.setAttribute('type', 'password');
        togglePassword.classList.remove('hide');
    }
}