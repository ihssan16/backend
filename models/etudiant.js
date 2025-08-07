const mongoose = require('mongoose');

const etudiantSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  faculte: { 
    type: String, 
    required: true,
    enum: ['Sciences', 'Informatique', 'Gestion', 'Lettres', 'Droit', 'Médecine']
  },
  email: { type: String, required: true, unique: true },
  telephone: { type: String },
  frais: { type: Number, default: 0 } // Frais de scolarité à payer
}, {
  timestamps: true
});
// Middleware pour définir les frais automatiquement selon la faculté
/*etudiantSchema.pre('save', function (next) {
  if (this.isModified('faculte') || this.isNew) {
    switch (this.faculte) {
      case 'Sciences':
        this.frais = 6000;
        break;
      case 'Informatique':
        this.frais = 8000;
        break;
      case 'Gestion':
        this.frais = 5500;
        break;
      case 'Lettres':
        this.frais = 4000;
        break;
      case 'Droit':
        this.frais = 5000;
        break;
      case 'Médecine':
        this.frais = 10000;
        break;
      default:
        this.frais = 0;
    }
  }
  next();
});*/

module.exports = mongoose.model('Etudiant', etudiantSchema);