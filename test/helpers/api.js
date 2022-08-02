import express from 'express';
import _ from 'lodash';

var app = express();
app.use(express.text());
app.use(express.json());


const router = express.Router();

router.get('/', function (req, res) {
    res.send('api');
});

router.get('/country', function (req, res) {
    res.send([{ "codigo": 4, "nome": "Afeganistão", "iso2": "AF", "iso3": "AFG" }, { "codigo": 710, "nome": "África do Sul", "iso2": "ZA", "iso3": "ZAF" }, { "codigo": 8, "nome": "Albânia", "iso2": "AL", "iso3": "ALB" }]);
});

router.post('/country', function (req, res) {
    res.send([{ "codigo": 4, "nome": "Afeganistão", "iso2": "AF", "iso3": "AFG" }, { "codigo": 710, "nome": "África do Sul", "iso2": "ZA", "iso3": "ZAF" }, { "codigo": 8, "nome": "Albânia", "iso2": "AL", "iso3": "ALB" }]);
});

router.get('/paginated', function (req, res) {
    res.send({
        data: [{ "codigo": 4, "nome": "Afeganistão", "iso2": "AF", "iso3": "AFG" }, { "codigo": 710, "nome": "África do Sul", "iso2": "ZA", "iso3": "ZAF" }, { "codigo": 8, "nome": "Albânia", "iso2": "AL", "iso3": "ALB" }],
        pagination: {
            page: 1,
            total: 10,
        }
    });
});

router.get('/house/:id', (req, res) => {
    var json = {
        "id": req.params.id,
        "apelido": "galpao 2",
        "dados": [
            { "id": 1364, "dadoTipoUid": "TIMOVEL", "dadoTipoUidPai": null, "usuarioId": null, "ativoId": 40, "operacaoId": null, "dado": "C-GP", "emissao": null, "validade": null, "origem": null }
        ],
        "enderecos": [
            {
                "usuarioId": null, "ativoId": 40, "dadoTipoUid": "END", "cep": "01010-000",
                "logradouro": "Rua São Bento", "bairro": "Centro", "numero": "3", "complemento": null,
                "municipio": 3550308, "municipioNome": "São Paulo", "estado": "SP"
            }
        ],
        "envolvidos": [
            { "usuarioId": 133, "usuarioNome": "DAVI BENJAMIN HENRY TEIXEIRA", "ativoId": 40, "ativoEnvolvidoTipoUid": "P" }
        ], "status": "N"
    };
    res.send(json);
});

/* person */
var personList = {
    '1': {
        "id": 1, "nome": "LUIZ CARLOS", "email": "teste@teste.com"
    },
    '2': {
        "id": 2, "nome": "JOAQUIM PEDRO ALEXANDRE BARROS", "email": "teste02@teste.com"
    },
    '3': {
        "id": 3, "nome": "DAVI BENJAMIN HENRY TEIXEIRA", "email": "teste03@teste.com"
    },
    '4': {
        "id": 4, "nome": "LEONARDO SILVA", "email": "teste04@teste.com"
    },
    '5': {
        "id": 5, "nome": "RONALDO SANTOS", "email": "teste05@teste.com"
    },
    '6': {
        "id": 6, "nome": "RONALDO SANTOS", "email": "teste05@teste.com"
    },
};

router.get('/person/:id', (req, res) => {
    var person = personList[req.params.id];
    // console.log('get person ', req.params.id, person, _.keys(personList));

    if (person)
        return res.send(person);
    res.status(404).send();
});

router.post('/person', (req, res) => {
    var person = {
        ...req.body,
        id: _.size(personList) + 1
    };
    personList[person.id] = person;

    return res.send({ id: person.id });
});

router.put('/person/:id', (req, res) => {
    var person = personList[req.params.id];
    if (person) {
        person = personList[req.params.id] = _.defaultsDeep(req.body, person, { updated: true });
        return res.send({ id: person.id });
    }
    res.status(404).send();
});

router.delete('/person/:id', (req, res) => {
    var person = personList[req.params.id];
    if (person) {
        delete personList[req.params.id];
        return res.send({});
        // return res.send({ id: req.params.id });
    }
    res.status(404).send();
});
/* */

router.get('/rent/:id', (req, res) => {
    var json = {
        "id": req.params.id,
        "ativoId": 40, "dataRecisao": null, "step": 8, "status": "N",
        "ativo": { "id": 40, "apelido": "galpao2", "dados": [], "enderecos": [], "envolvidos": [], "status": "V" },
        "envolvidos": [
            { "id": 204, "aluguelId": 68, "usuarioId": 1, "perfil": "C", "deleted": false },
            { "id": 205, "aluguelId": 68, "usuarioId": 2, "perfil": "L", "deleted": false },
            { "id": 206, "aluguelId": 68, "usuarioId": 3, "perfil": "P", "deleted": false },
            { "id": 207, "aluguelId": 68, "usuarioId": 6, "perfil": "P", "deleted": false },
            { "id": 208, "aluguelId": 68, "usuarioId": 5, "perfil": "P", "deleted": false }
        ]
    };
    res.send(json);
});

app.use(router);
var appService = app.listen(3000, () => {
    console.log(`Running on http://localhost:3000`);
});

export { app, appService };