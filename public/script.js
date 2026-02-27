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

async function executarAcaoProduto() {
    const nome = document.getElementById('p-nome').value.trim();
    const preco = parseFloat(document.getElementById('p-preco').value);

    // Validação imediata no Frontend
    if (nome.length < 2) {
        alert("Por favor, digite um nome válido para o produto.");
        return;
    }
    if (isNaN(preco) || preco <= 0) {
        alert("O preço deve ser um valor positivo.");
        return;
    }

    const url = editandoId ? `/products/${editandoId}` : '/products';
    const metodo = editandoId ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ nome, preco })
        });

        if (res.ok) {
            cancelarEdicao();
            carregarProdutos();
        } else {
            const erro = await res.json();
            alert("Erro do servidor: " + erro.msg);
        }
    } catch (err) {
        alert("Erro de conexão.");
    }
}


function prepararEdicao(id, nome, preco) {
    editandoId = id;
    document.getElementById('p-nome').value = nome;
    document.getElementById('p-preco').value = preco;
    
    const btn = document.getElementById('btn-salvar');
    btn.innerText = "Salvar";
    btn.style.background = "#ff9f43"; // Cor laranja para indicar edição
}

function cancelarEdicao() {
    editandoId = null;
    document.getElementById('p-nome').value = '';
    document.getElementById('p-preco').value = '';
    const btn = document.getElementById('btn-salvar');
    btn.innerText = "Adicionar";
    btn.style.background = "#28a745";
}


//let produtosLocal = []; // Variável para guardar a lista completa


//let editandoId = null;
async function executarAcaoProduto() {
    const nome = document.getElementById('p-nome').value.trim();
    const preco = parseFloat(document.getElementById('p-preco').value);

    // Validação imediata no Frontend
    if (nome.length < 2) {
        alert("Por favor, digite um nome válido para o produto.");
        return;
    }
    if (isNaN(preco) || preco <= 0) {
        alert("O preço deve ser um valor positivo.");
        return;
    }

    const url = editandoId ? `/products/${editandoId}` : '/products';
    const metodo = editandoId ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ nome, preco })
        });

        if (res.ok) {
            cancelarEdicao();
            carregarProdutos();
        } else {
            const erro = await res.json();
            alert("Erro do servidor: " + erro.msg);
        }
    } catch (err) {
        alert("Erro de conexão.");
    }
}


function prepararEdicao(id, nome, preco) {
    editandoId = id;
    document.getElementById('p-nome').value = nome;
    document.getElementById('p-preco').value = preco;
    
    const btn = document.getElementById('btn-salvar');
    btn.innerText = "Salvar";
    btn.style.background = "#ff9f43"; // Cor laranja para indicar edição
}

function cancelarEdicao() {
    editandoId = null;
    document.getElementById('p-nome').value = '';
    document.getElementById('p-preco').value = '';
    const btn = document.getElementById('btn-salvar');
    btn.innerText = "Adicionar";
    btn.style.background = "#28a745";
}



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

let produtosLocal = []; // Variável para guardar a lista completa

async function carregarProdutos() {
    const res = await fetch('/products', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    
    // Guardamos os dados recebidos na nossa variável global
    produtosLocal = await res.json();
    
    // Renderizamos a lista completa inicialmente
    renderizarLista(produtosLocal);
}

// Nova função apenas para desenhar os itens na tela
function renderizarLista(listaParaExibir) {
    const listaDiv = document.getElementById('lista-produtos');
    listaDiv.innerHTML = '';

    if (listaParaExibir.length === 0) {
        listaDiv.innerHTML = '<p style="text-align:center; color:#999;">Nenhum produto encontrado.</p>';
        return;
    }

    listaParaExibir.forEach(p => {
        listaDiv.innerHTML += `
            <div class="produto-item" style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <div>
                    <strong>${p.nome}</strong><br>
                    <span style="color: #28a745;">R$ ${Number(p.preco).toFixed(2)}</span>
                </div>
                <div>
                    <button onclick="prepararEdicao('${p._id}', '${p.nome}', ${p.preco})" style="background: #e1f5fe; color: #039be5; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-right: 5px;">Editar</button>
                    <button onclick="deletarProduto('${p._id}')" style="background: #ffebee; color: #c62828; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Excluir</button>
                </div>
            </div>
        `;
    });
}

// Chame esta função dentro do carregarDadosDoServidor()
async function carregarListasDeCompras() {
    try {
        const res = await fetch('/shopping-lists', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const listas = await res.json();
        const container = document.getElementById('lista-compras-salvas');
        
        if (listas.length === 0) {
            container.innerHTML = '<p style="color:#999; font-size:14px;">Nenhuma lista salva ainda.</p>';
            return;
        }

        container.innerHTML = '';
        listas.forEach(lista => {
            const dataFormatada = new Date(lista.data).toLocaleDateString('pt-BR');
            container.innerHTML += `
                <div class="item-lista-salva" onclick='abrirDetalhes(${JSON.stringify(lista)})'>
                    <div>
                        <strong>${lista.nome}</strong><br>
                        <small style="color:#666;">Data: ${dataFormatada}</small>
                    </div>
                    <span class="badge-itens">${lista.itens.length} itens</span>
                </div>
            `;
        });
    } catch (err) {
        console.error("Erro ao carregar listas:", err);
    }
}

function abrirDetalhes(lista) {
    document.getElementById('detalhe-nome-lista').innerText = lista.nome;
    const dataFormatada = new Date(lista.data).toLocaleDateString('pt-BR');
    document.getElementById('detalhe-data-lista').innerText = "Criada em: " + dataFormatada;

    const itensDiv = document.getElementById('detalhe-itens');
    itensDiv.innerHTML = '<h4>Itens:</h4>';
    
    lista.itens.forEach(item => {
        itensDiv.innerHTML += `
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding:5px 0;">
                <span>${item.nome}</span>
                <span style="font-weight:bold;">x${item.quantidade}</span>
            </div>
        `;
    });

    document.getElementById('modal-detalhes').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modal-detalhes').style.display = 'none';
}

// Lembre-se de atualizar o carregarDadosDoServidor para incluir carregarListasDeCompras()


// A função mágica de busca
function filtrarProdutos() {
    const termoBusca = document.getElementById('campo-busca').value.toLowerCase();
    
    // Filtramos o array local com base no nome
    const produtosFiltrados = produtosLocal.filter(p => 
        p.nome.toLowerCase().includes(termoBusca)
    );

    // Mandamos renderizar apenas os que sobraram no filtro
    renderizarLista(produtosFiltrados);
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
