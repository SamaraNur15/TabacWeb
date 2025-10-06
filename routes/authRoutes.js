const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');

// Registro
router.post('/register', async(req, res) => {
    const { nombre, email, password, telefono, direccion } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        // Verificar si el usuario ya existe
        const existingUser = await Usuario.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Usuario ya existe" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const nuevoUsuario = await Usuario.create({
            nombre,
            email,
            password: hashedPassword,
            telefono,
            direccion
        });
        res.status(201).json({ message: "Usuario registrado con éxito ✅" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al registrar usuario" });
    }
});

// Login
router.post('/login', async(req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(400).json({ message: "Usuario o contraseña incorrectos" });
        }

        const passwordMatch = await bcrypt.compare(password, usuario.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: "Usuario o contraseña incorrectos" });
        }

        // Opcional: eliminar password antes de enviar la info al cliente
        const { password: pwd, ...userData } = usuario.toObject();

        res.status(200).json(userData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al iniciar sesión" });
    }
});

module.exports = router;