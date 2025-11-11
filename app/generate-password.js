const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'hello1234';
    const saltRounds = 10; // Assurez-vous que c'est le même que dans votre app

    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Mot de passe:', password);
    console.log('Hash généré:', hash);
}

generateHash();