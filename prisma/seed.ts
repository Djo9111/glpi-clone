import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Supprimer les anciens départements (optionnel)
  await prisma.departement.deleteMany();

  // Ajouter une liste de départements
  const departements = [
    { nom: "Informatique" },
    { nom: "Ressources Humaines" },
    { nom: "Finances" },
    { nom: "Logistique" },
    { nom: "Juridique" },
    { nom: "Communication" },
    { nom: "Exploitation" },
  ];

  await prisma.departement.createMany({
    data: departements,
    skipDuplicates: true, // Évite les doublons si on relance
  });

  console.log("✅ Départements insérés avec succès !");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
