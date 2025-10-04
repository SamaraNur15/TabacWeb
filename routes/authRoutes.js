const { Router } = require('express');
const router = Router();
const Usuario = require('../models/Usuario'); // Asegurate que la ruta sea correcta

// Ruta de prueba
router.get('/test', (req, res) => {
    res.json({ mensaje: 'Auth funcionando' });
});

// Registro
router.post('/register', async(req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) return res.status(400).json({ message: 'Usuario ya existe' });

        const nuevoUsuario = new Usuario({ nombre, email, password });
        await nuevoUsuario.save();

        res.status(201).json({
            nombre: nuevoUsuario.nombre,
            email: nuevoUsuario.email,
            _id: nuevoUsuario._id
        });
    } catch (err) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Login
router.post('/login', async(req, res) => {
    const { email, password } = req.body;
    try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario || usuario.password !== password) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }

        res.json({
            nombre: usuario.nombre,
            email: usuario.email,
            _id: usuario._id
        });
    } catch (err) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

module.exports = router;