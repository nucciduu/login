    // 1. Verifica se existe um token no localStorage assim que a página abre
    const token = localStorage.getItem('token');

    // Se não tiver token, manda de volta para o login imediatamente
    if (!token) {
        window.location.href = "index.html";
    }

    async function carregarDadosDoServidor() {
        try {
            // 2. Faz a chamada para a rota protegida /perfil
            const resposta = await fetch('/perfil', {
                method: 'GET',
                headers: { 
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }
            });

            if (resposta.ok) {
                const dados = await resposta.json();

                // 3. Preenche os campos com os dados vindos do MongoDB
                document.getElementById('email-usuario').innerText = dados.email;
                document.getElementById('id-usuario').innerText = dados._id;
                
                // Pega a primeira letra do email para o Avatar
                document.getElementById('avatar-inicial').innerText = dados.email.charAt(0).toUpperCase();

                // 4. Troca o Loading pelo conteúdo real
                document.getElementById('loading-area').style.display = 'none';
                document.getElementById('conteudo-perfil').style.display = 'block';
                carregarProdutos()

            } else {
                // Se o token for inválido ou expirado, limpa e desloga
                console.error("Sessão inválida.");
                logout();
            }
        } catch (erro) {
            console.error("Erro de conexão:", erro);
            alert("Erro ao conectar com o servidor.");
            logout();
        }
    }

    function logout() {
        localStorage.removeItem('token'); // Apaga o "passaporte"
        window.location.href = "index.html"; // Volta para o login
    }

    // Inicia a busca de dados ao carregar a página
    carregarDadosDoServidor();



async function carregarProdutos() {
    const res = await fetch('/products', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const produtos = await res.json();
    const lista = document.getElementById('lista-produtos');
    lista.innerHTML = ''; // Limpa a lista

    produtos.forEach(p => {
        lista.innerHTML += `
            <div style="background: #f8f9fa; padding: 10px; margin-bottom: 5px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #007bff;">
                <div>
                    <strong>${p.nome}</strong><br>
                    <small>R$ ${p.preco}</small>
                </div>
                <button onclick="deletarProduto('${p._id}')" style="background:none; border:none; color:red; cursor:pointer;">&times;</button>
            </div>
        `;
    });
}

async function adicionarProduto() {
    const nome = document.getElementById('p-nome').value;
    const preco = document.getElementById('p-preco').value;

    await fetch('/products', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token 
        },
        body: JSON.stringify({ nome, preco })
    });

    document.getElementById('p-nome').value = '';
    document.getElementById('p-preco').value = '';
    carregarProdutos(); // Atualiza a "RecyclerView"
}

async function deletarProduto(id) {
    if(confirm("Deseja excluir?")) {
        await fetch(`/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        carregarProdutos();
    }
}

