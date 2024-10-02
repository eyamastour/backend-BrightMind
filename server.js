const express = require('express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const UserRouter = require('./api/User'); 
const AdminRouter = require('./api/Admin'); 
const bodyParser = require('body-parser');

require('./config/db'); 

const app = express();
const port = 3000;

// Swagger configuration
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0', 
        info: {
            title: 'User API',

            version: '1.0.0',
            description: 'API documentation ', 
        },
        servers: [
            {
                url: `http://localhost:${port}`,
            },
        ],
    },
    apis: ['./api/*.js'], 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs)); 

app.use(bodyParser.json());
app.use('/user', UserRouter);
app.use('/admin', AdminRouter);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
