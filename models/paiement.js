const mongoose = require('mongoose');

// Schéma pour le compteur séquentiel
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

// Schéma principal des paiements
const paiementSchema = new mongoose.Schema({
  refId: { type: Number, unique: true }, // Nouveau champ numérique séquentiel
  client: { type: String, required: true },
  montant: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  moyen: { 
    type: String, 
    enum: ['espèces', 'carte', 'virement'], 
  },
  utilisateurId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
},

  description: { type: String },
  faculte: {
    type: String,
    required: false, // Rendons-le optionnel pour le test
    trim: true,
    default: 'Non spécifiée' // Valeur par défaut explicite
  },
  pieceJoint:{
    type:String
  }
}, { 
  versionKey: false, // Désactive le champ __v
  strict: false // Accepte les champs non définis dans le schéma TEMPORAIREMENT
});
// Middleware pour générer automatiquement refId avant sauvegarde
paiementSchema.pre('save', async function(next) {
  if (!this.refId) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'paiementRef' }, // Identifiant du compteur
        { $inc: { seq: 1 } },    // Incrémente la séquence
        { new: true, upsert: true }
      );
      this.refId = counter.seq;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});




module.exports = mongoose.model('Paiement', paiementSchema);