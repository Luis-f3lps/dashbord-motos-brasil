document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Bate na API para perguntar: "Eu tenho o Cookie de acesso?"
        const response = await fetch('/api/check-auth');
        const data = await response.json();

        // Descobre em qual página o usuário está agora
        const isLoginPage = window.location.pathname.includes('login.html') || window.location.pathname === '/';

        if (data.Autenticado) {
            // Se ESTÁ logado e tentou abrir a tela de login, manda direto pro painel!
            if (isLoginPage) {
                window.location.href = '/admin';
            }
        } else {
            // Se NÃO está logado e tentou abrir qualquer outra tela, manda pro login
            if (!isLoginPage) {
                window.location.href = '/login.html';
            }
        }
    } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
    }
});

// ==========================================
// FUNÇÃO DE LOGOUT (SAIR DO SISTEMA)
// ==========================================

window.fazerLogout = async function() {
    try {
        await fetch('/api/logout'); // Pede pro servidor destruir o crachá
        window.location.href = '/login.html'; // Volta pra tela de login
    } catch (error) {
        console.error("Erro ao sair:", error);
    }
}