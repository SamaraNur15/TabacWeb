const { Router } = require('express');
const router = Router();

router.get('/test', (req, res) => {
    res.json({ mensaje: 'Auth funcionando' });
});

module.exports = router;