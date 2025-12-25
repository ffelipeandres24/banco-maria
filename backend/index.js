const express = require('express');
const cors = require('cors');
const prestamoRoutes = require('./routes/prestamoRoutes');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // Para poder recibir datos JSON

// Rutas
app.use('/api', prestamoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor experto corriendo en el puerto ${PORT}`);
});