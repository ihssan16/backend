const User = require('./models/user');
const bcrypt = require('bcrypt');

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


app.post('/paiements', async (req, res) => {
  try {
    const { client, montant, moyen, description, faculte, utilisateurId } = req.body;

    // Vérification minimale
    if (!utilisateurId) {
      return res.status(400).json({ message: 'utilisateurId manquant' });
    }

    const nouveauPaiement = new Paiement({
      client,
      montant,
      moyen,
      description,
      faculte,
      utilisateurId
    });

    const saved = await nouveauPaiement.save();
    console.log('Paiement sauvegardé:', saved); // Log le résultat
    res.status(201).json(saved);
  } catch (err) {
    console.error('Erreur de sauvegarde:', err); // Log détaillé
    res.status(400).json({ 
      error: err.message,
      stack: err.stack,
       // Ajoutez la stack trace pour le débogage
       errors: err.errors
    });
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

// GET paiements d’un utilisateur



// Démarrer le serveur
app.listen(PORT, () => console.log(`🚀 Serveur en ligne sur http://localhost:${PORT}`));
