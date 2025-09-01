// api-comidas/seed.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Comida = require('./models/comida'); // ojo: respetar mayúscula/minúscula

async function runSeed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB
    });
    console.log('✅ Conectado a MongoDB');

    // limpiar colección antes de cargar (opcional, quita todo lo anterior)
    await Comida.deleteMany({});
    console.log('🗑️ Colección vaciada');

    // datos de prueba
    const comidas = [
      // === Salados ===
      {
        nombre: 'Keppe al horno',
        categoria: 'salado',
        precio: 6500,
        imagen: '/img/Kebab.png',
        descripcion: 'Trigo burgol con carne y especias, horneado.',
        apto_vegetariano: false,
        picante: true,
        stock: 18,
        tiempo_preparacion_min: 15,
        calificacion: 4.6,
        cantidad_resenas: 128,
        entrega: { retiro_en_local: true, envio_a_domicilio: true }
      },
      {
        nombre: 'Empanadas Árabes',
        categoria: 'salado',
        precio: 5400,
        imagen: '/img/empanadas-arabes-foto.webp',
        descripcion: 'Empanadas tradicionales rellenas de carne y especias.',
        apto_vegetariano: false,
        picante: false,
        stock: 30,
        tiempo_preparacion_min: 20,
        calificacion: 4.8,
        cantidad_resenas: 210,
        entrega: { retiro_en_local: true, envio_a_domicilio: true }
      },

      // === Dulces ===
      {
        nombre: 'Baklava',
        categoria: 'dulce',
        precio: 4800,
        imagen: '/img/baklava.jpg',
        descripcion: 'Capas de masa filo, nueces y almíbar perfumado.',
        apto_vegetariano: true,
        stock: 9,
        tiempo_preparacion_min: 5,
        calificacion: 4.8,
        cantidad_resenas: 201,
        entrega: { retiro_en_local: true, envio_a_domicilio: true }
      },
      {
        nombre: 'Chocotorta',
        categoria: 'dulce',
        precio: 5500,
        imagen: '/img/chocotorta.jpg',
        descripcion: 'Postre clásico argentino con galletitas y dulce de leche.',
        apto_vegetariano: true,
        stock: 15,
        tiempo_preparacion_min: 10,
        calificacion: 4.9,
        cantidad_resenas: 320,
        entrega: { retiro_en_local: true, envio_a_domicilio: true }
      },

      // === Bebidas ===
      {
        nombre: 'Coca-Cola 500ml',
        categoria: 'bebidas',
        precio: 1500,
        imagen: '/img/cocacola.jpg',
        descripcion: 'Coca-Cola clásica bien fría, botella de 500ml.',
        apto_vegetariano: true,
        stock: 50,
        tiempo_preparacion_min: 1,
        calificacion: 4.9,
        cantidad_resenas: 450,
        entrega: { retiro_en_local: true, envio_a_domicilio: true }
      },
      {
        nombre: 'Pepsi 500ml',
        categoria: 'bebidas',
        precio: 1400,
        imagen: '/img/pepsi.jpg',
        descripcion: 'Pepsi refrescante, botella de 500ml.',
        apto_vegetariano: true,
        stock: 40,
        tiempo_preparacion_min: 1,
        calificacion: 4.8,
        cantidad_resenas: 300,
        entrega: { retiro_en_local: true, envio_a_domicilio: true }
      },
      {
        nombre: 'Agua Mineral 500ml',
        categoria: 'bebidas',
        precio: 1000,
        imagen: '/img/agua.jpg',
        descripcion: 'Agua mineral sin gas, botella de 500ml.',
        apto_vegetariano: true,
        stock: 60,
        tiempo_preparacion_min: 1,
        calificacion: 4.7,
        cantidad_resenas: 120,
        entrega: { retiro_en_local: true, envio_a_domicilio: true }
      }
    ];

    await Comida.insertMany(comidas);
    console.log(`✅ Insertadas ${comidas.length} comidas de prueba`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error en seed:', err.message);
    process.exit(1);
  }
}

runSeed();
