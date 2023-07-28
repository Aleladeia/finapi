const express = require("express")
const { v4: uuidv4 } = require("uuid")


const app = express();

const customers = []; //banco fake para armazenar os dados, é só um simples array vazio por enquanto

//middleware para permitir receber objeto json na request.
app.use(express.json())

//Middleware
function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;

    //diferente do some, o uso do find é usado pois neste caso precisamos retornar o objeto, 
    // a informação completa, ou seja todos os dados.
    const customer = customers.find(customer => customer.cpf === cpf);

    if (!customer) {
        return response.status(400).json({ error: "Customer not found" });
    }

    request.customer = customer;

    return next();
}

function getBalance(statement){
    const balance = statement.reduce((acc, operation) =>{
        if(operation.type === "credit"){
            return acc + operation.amount;
        } else{
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}

//usado body params, informas ele no postman na opção body em formato json
app.post("/account", (request, response) => {
    const { cpf, name } = request.body;

    //verifica no array usando some para retorno true ou false se o customer existe com o cpf informado
    // existe ou não existe
    const customerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );

    if (customerAlreadyExists) {
        return response.status(400).json({ error: "customer already exists!" })
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: [],
    })


    return response.status(201).send();


});

app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    return response.json(customer.statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;

    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();

})

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);

    if(balance < amount){
        return response.status(400).json({error: "Insufficiente funds!"})
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation)
    return response.status(201).send();
})

app.get("/statement/date", verifyIfExistsAccountCPF,(request, response)=>{
    const { customer } = request();

    const { date } = request.query;

    const dateFormat = new Date(date + "00:00");

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat.toDateString()) )

    return response.json(statement)

})

app.listen(3333);
