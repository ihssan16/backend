const User = require('./models/user');
const bcrypt = require('bcrypt');
const Etudiant = require('./models/etudiant');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Paiement = require('./models/paiement');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/encaissement', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('Erreur MongoDB :', err));

// GET un paiement spécifique
// Ajoutez cette route CRUCIALE pour récupérer un paiement par ID
// Ajoutez cette route GET spécifique AVANT les autres routes
app.get('/paiements', async (req, res) => {
  try {
    const paiements = await Paiement.find().sort({ date: -1 }); // Trie par date décroissante
    res.json(paiements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Route pour récupérer tous les étudiants
app.get('/etudiants', async (req, res) => {
  try {
    const etudiants = await Etudiant.find();
    console.log(etudiants);
    res.json(etudiants);
  } catch (err) {
    console.error('Erreur récupération étudiants:', err);
    res.status(500).json({ error: err.message });
  }
});

// Route pour récupérer les étudiants par faculté
app.get('/etudiants/faculte/:faculte', async (req, res) => {
  try {
    const etudiants = await Etudiant.find({ 
      faculte: req.params.faculte 
    }).sort({ nom: 1, prenom: 1 });
    res.json(etudiants);
  } catch (err) {
    console.error('Erreur récupération étudiants par faculté:', err);
    res.status(500).json({ error: err.message });
  }
});


// Route pour obtenir un paiement spécifique (à ajouter)
// Route GET pour un paiement spécifique (à ajouter/modifier)
app.get('/paiements/:id', async (req, res) => {
  try {
    // Vérification que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID invalide' });
    }

    const paiement = await Paiement.findById(req.params.id);
    
    if (!paiement) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }
    
    res.json(paiement);
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: err.message 
    });
  }
});
// Ajoutez aussi la route DELETE pour être complet
app.delete('/paiements/:id', async (req, res) => {
  try {
    await Paiement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Paiement supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.put('/paiements/:id', async (req, res) => {
  try {
    const paiement = await Paiement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(paiement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const multer = require('multer');

// Configuration Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Route POST avec pièce jointe facultative
app.post('/paiements', upload.single('pieceJoint'), async (req, res) => {
  try {
    const {
      client,
      montant,
      moyen,
      description,
      faculte,
      etudiantId,
      utilisateurId
    } = req.body;

    const nouveauPaiement = new Paiement({
      client,
      montant,
      moyen,
      description,
      faculte,
      etudiantId,
      utilisateurId,
      pieceJoint: req.file ? `uploads/${req.file.filename}` : null // facultatif ici
    });

    await nouveauPaiement.save();
    res.status(201).json(nouveauPaiement);
  } catch (error) {
    console.error("Erreur lors de l'ajout du paiement :", error);
    res.status(400).json({ message: "Erreur lors de l'ajout du paiement", error });
  }
});
// Enregistrement d'un utilisateur
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Utilisateur déjà existant' });

    const newUser = new User({ email, password });
    await newUser.save();

    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Connexion d'un utilisateur
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('[DEBUG] Données reçues:', { email, password: password.substring(0, 1) + '***' }); // Log masqué
    
    const user = await User.findOne({ email }).select('+password'); // Important si le password est exclu par défaut
    if (!user) {
      console.log('[DEBUG] Utilisateur non trouvé pour:', email);
      return res.status(401).json({ message: 'Email incorrect' });
    }

    console.log('[DEBUG] Mot de passe stocké (hash):', user.password);
    
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('[DEBUG] Résultat comparaison bcrypt:', isMatch);
    
    if (!isMatch) {
      console.log('[DEBUG] Échec comparaison pour:', email);
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    console.log('[DEBUG] Connexion réussie pour:', email);
    res.status(200).json({ 
      message: 'Connexion réussie', 
      user: { 
        _id: user._id, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

app.put('/api/auth/change-password/:userId', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.params.userId;

    // Récupérer l'utilisateur
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier l'ancien mot de passe
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Ancien mot de passe incorrect' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Sauvegarder le nouveau mot de passe
    await user.save();

    res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (err) {
    console.error('[Erreur changement mdp]', err);
    res.status(500).json({ message: 'Erreur lors du changement de mot de passe', error: err.message });
  }
});

// Nouvelle route pour les paiements récents
// Ajoutez cette route spécifique
app.get('/paiements/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const paiements = await Paiement.find()
      .sort({ date: -1 })  // Trie par date décroissante (les plus récents en premier)
      .limit(limit);       // Limite aux X derniers résultats
    
    res.json(paiements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/paiements/utilisateur/:userId', async (req, res) => {
  try {
    const paiements = await Paiement.find({ utilisateurId: req.params.userId });
    res.json(paiements);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des paiements.' });
  }
});






// Démarrer le serveur
app.listen(PORT, () => console.log(`🚀 Serveur en ligne sur http://localhost:${PORT}`));
