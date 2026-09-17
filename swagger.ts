import swaggerAutogen from "swagger-autogen";
const doc = {
info: {
title: "API Lancheria do ET",
description: "Documentação da API da lancheria",
version: "1.0.0"
},
servers: [{url: "http://localhost:3000"}
]
};
const outputFile = "./swagger-output.json";
const routes = ["./src/server.ts"];
swaggerAutogen({ openapi: "3.0.0" })(
outputFile,
routes,
doc
);