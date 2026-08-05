require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const PERNA_DIR = 'C:\\Users\\abner\\OneDrive\\Desktop\\personal\\PERNA';

const exercisesData = {
  quadriceps: [
    "Agachamento livre com barra", "Agachamento frontal com barra", "Agachamento goblet", "Agachamento no Smith", "Agachamento hack", "Agachamento pendular", "Belt squat — agachamento com cinto", "Agachamento búlgaro", "Agachamento sissy", "Agachamento espanhol", "Pistol squat", "Wall sit — agachamento isométrico na parede", "Box squat", "Agachamento com calcanhares elevados", "Agachamento Zercher", "Agachamento landmine", "Leg press 45°", "Leg press horizontal", "Leg press vertical", "Leg press unilateral", "Cadeira extensora", "Cadeira extensora unilateral", "Avanço à frente", "Afundo estacionário", "Afundo reverso", "Afundo caminhando", "Afundo no Smith", "Afundo com barra", "Afundo com halteres", "Step-up no banco", "Step-down", "Passada lateral", "Agachamento Cossack", "Subida de escada", "Empurrar trenó", "Arrastar trenó para trás"
  ],
  hamstrings: [
    "Stiff com barra", "Stiff com halteres", "Stiff no Smith", "Stiff unilateral", "Levantamento terra romeno com barra", "Terra romeno com halteres", "Terra romeno unilateral", "Good morning com barra", "Good morning no Smith", "Mesa flexora deitada", "Mesa flexora unilateral", "Cadeira flexora sentada", "Cadeira flexora unilateral", "Flexora em pé", "Flexão de joelho na polia", "Flexão de joelho com caneleira", "Flexão de joelho com bola suíça", "Nordic curl", "Glute-ham raise", "Hamstring slide curl", "Ponte com flexão de joelhos", "Kettlebell swing", "Levantamento terra convencional", "Levantamento terra com trap bar", "Reverse hyperextension"
  ],
  glutes: [
    "Elevação pélvica com barra — hip thrust", "Elevação pélvica no Smith", "Elevação pélvica na máquina", "Elevação pélvica com halter", "Elevação pélvica unilateral", "Ponte de glúteos", "Ponte unilateral", "Frog pump", "Coice na polia", "Coice na máquina", "Coice com caneleira", "Coice com elástico", "Extensão de quadril na máquina", "Extensão de quadril no banco romano", "Pull-through na polia", "Abdução na máquina", "Abdução de quadril na polia", "Abdução com caneleira", "Abdução deitada", "Abdução com miniband", "Caminhada lateral com miniband", "Caminhada diagonal com miniband", "Clamshell com elástico", "Step-up alto", "Afundo reverso longo", "Agachamento búlgaro com passada longa", "Agachamento sumô", "Terra sumô", "Stiff sumô", "Reverse lunge no Smith", "Reverse hyper", "Extensão de quadril quadrúpede", "Fire hydrant", "Elevação lateral da perna em pé", "Glute bridge march"
  ],
  adductor: [
    "Cadeira adutora", "Adução unilateral na máquina", "Adução de quadril na polia", "Adução com caneleira", "Adução deitada", "Agachamento sumô", "Terra sumô", "Afundo lateral", "Passada lateral", "Agachamento Cossack", "Copenhagen plank", "Deslizamento lateral", "Adução com bola entre os joelhos", "Adução isométrica", "Leg press com base aberta"
  ],
  abductors: [
    "Cadeira abdutora", "Abdução na polia baixa", "Abdução com caneleira", "Abdução deitada de lado", "Caminhada lateral com elástico", "Monster walk", "Clamshell", "Fire hydrant", "Elevação lateral da perna", "Step-down lateral", "Skater squat", "Abdução em quatro apoios", "Abdução em pé na máquina", "Abdução isométrica com miniband"
  ],
  calves: [
    "Panturrilha em pé na máquina", "Panturrilha em pé no Smith", "Panturrilha com barra", "Panturrilha com halteres", "Panturrilha unilateral", "Panturrilha sentada", "Panturrilha no leg press 45°", "Panturrilha no leg press horizontal", "Panturrilha no hack", "Panturrilha no belt squat", "Donkey calf raise", "Panturrilha no degrau", "Panturrilha com joelhos flexionados", "Panturrilha no aparelho pendular", "Salto na ponta dos pés", "Caminhada na ponta dos pés", "Tibialis raise na parede", "Tibialis raise na máquina", "Dorsiflexão com elástico", "Dorsiflexão na polia", "Elevação da ponta dos pés sentado", "Caminhada apoiando os calcanhares"
  ],
  back: [
    "Puxada frontal com pegada aberta", "Puxada frontal com pegada fechada", "Puxada com pegada neutra", "Puxada supinada", "Puxada unilateral na máquina", "Puxada unilateral na polia", "Puxada articulada", "Puxada convergente", "Barra fixa pronada", "Barra fixa supinada", "Barra fixa neutra", "Barra fixa assistida", "Chin-up", "Pulldown com braços estendidos", "Pulldown unilateral", "Pulldown ajoelhado", "Puxada alta com corda", "Puxada na máquina Hammer", "Puxada atrás da cabeça",
    "Remada curvada com barra", "Remada curvada supinada", "Remada Pendlay", "Remada cavalinho — T-bar", "Remada landmine", "Remada unilateral com halter", "Remada serrote", "Remada baixa na polia", "Remada baixa com triângulo", "Remada baixa com barra aberta", "Remada baixa unilateral", "Remada articulada", "Remada convergente", "Remada máquina com apoio no peito", "Remada Hammer", "Remada no Smith", "Remada invertida", "Remada australiana", "Remada com elástico", "Remada alta na polia", "Remada Meadows", "Remada gorila com kettlebells", "Remada apoiada no banco inclinado", "Seal row", "Renegade row", "Remada unilateral na landmine", "Remada sentado na máquina",
    "Extensão lombar no banco romano", "Hiperextensão 45°", "Hiperextensão horizontal", "Extensão lombar na máquina", "Reverse hyper", "Good morning", "Levantamento terra convencional", "Levantamento terra romeno", "Rack pull", "Terra com trap bar", "Superman no chão", "Bird dog", "Deadlift isométrico", "Back extension com anilha", "Jefferson curl",
    "Encolhimento com barra", "Encolhimento com halteres", "Encolhimento no Smith", "Encolhimento na máquina", "Encolhimento na polia", "Encolhimento atrás do corpo", "Encolhimento com trap bar", "Farmer walk", "Suitcase carry", "Rack carry", "Remada alta", "Face pull", "Crucifixo inverso", "Remada com apoio no peito", "Elevação em Y", "Prone Y raise", "Prone T raise", "Scapular pull-up", "Depressão escapular na polia", "Retração escapular na máquina"
  ],
  shoulders: [
    "Desenvolvimento militar com barra", "Desenvolvimento com halteres", "Desenvolvimento sentado com halteres", "Desenvolvimento no Smith", "Desenvolvimento na máquina", "Desenvolvimento articulado", "Arnold press", "Push press", "Landmine press unilateral", "Elevação frontal com halteres", "Elevação frontal com barra", "Elevação frontal com anilha", "Elevação frontal na polia", "Elevação frontal unilateral", "Elevação frontal com corda",
    "Elevação lateral com halteres", "Elevação lateral sentado", "Elevação lateral unilateral", "Elevação lateral inclinada", "Elevação lateral na polia", "Elevação lateral bilateral na polia", "Elevação lateral na máquina", "Elevação lateral com elástico", "Elevação lateral apoiada no banco", "Elevação lateral parcial", "Elevação lateral atrás do corpo na polia", "Remada alta com pegada aberta", "Remada alta na polia", "Remada alta com barra EZ",
    "Crucifixo inverso na máquina", "Crucifixo inverso com halteres", "Crucifixo inverso no banco inclinado", "Crucifixo inverso na polia", "Face pull com corda", "Face pull com elástico", "Remada alta para deltoide posterior", "Remada com cotovelos abertos", "Rear delt row", "Elevação posterior unilateral na polia", "Elevação posterior deitado", "Reverse fly com elástico", "Remada invertida com cotovelos abertos",
    "Rotação externa na polia", "Rotação externa com elástico", "Rotação externa deitado", "Rotação interna na polia", "Rotação interna com elástico", "Cuban rotation", "Cuban press", "Elevação em Y", "Elevação em T", "Elevação em W", "Scaption com halteres", "Wall slide", "Face pull com rotação externa", "Bottom-up kettlebell press", "Farmer carry unilateral"
  ],
  biceps: [
    "Rosca direta com barra reta", "Rosca direta com barra EZ", "Rosca direta na polia", "Rosca direta na máquina", "Rosca alternada com halteres", "Rosca simultânea com halteres", "Rosca martelo", "Rosca martelo cruzada", "Rosca martelo com corda", "Rosca Scott com barra", "Rosca Scott com halter", "Rosca Scott na máquina", "Rosca inclinada com halteres", "Rosca concentrada", "Rosca spider", "Rosca Bayesian na polia", "Rosca unilateral na polia", "Rosca alta na polia dupla", "Rosca 21", "Rosca drag", "Rosca Zottman", "Rosca inversa", "Rosca pronada na polia", "Rosca com elástico", "Chin-up com foco em bíceps"
  ],
  triceps: [
    "Tríceps pulley com barra reta", "Tríceps pulley com barra V", "Tríceps pulley com corda", "Tríceps unilateral na polia", "Tríceps unilateral com pegada invertida", "Tríceps francês com halter", "Tríceps francês unilateral", "Tríceps francês com barra EZ", "Tríceps francês na polia", "Tríceps testa com barra", "Tríceps testa com halteres", "Tríceps testa na polia", "Extensão acima da cabeça com corda", "Extensão unilateral acima da cabeça", "Coice de tríceps com halter", "Coice de tríceps na polia", "Tríceps na máquina", "Tríceps mergulho na máquina assistida", "Extensão de tríceps cruzada na polia", "Tate press com halteres", "Skull crusher", "Extensão de tríceps com elástico"
  ],
  forearm: [
    "Rosca de punho com barra", "Rosca de punho com halteres", "Rosca de punho na polia", "Extensão de punho com barra", "Extensão de punho com halteres", "Rosca inversa", "Rosca Zottman", "Pronação com halter", "Supinação com halter", "Desvio radial do punho", "Desvio ulnar do punho", "Hand gripper", "Farmer walk", "Plate pinch", "Dead hang na barra", "Toalha na barra fixa", "Wrist roller", "Sustentação de barra pesada", "Sustentação na trap bar", "Pinça com anilhas"
  ],
  abs: [
    "Abdominal tradicional", "Crunch no chão", "Crunch na máquina", "Crunch na polia alta", "Crunch ajoelhado na polia", "Abdominal no banco declinado", "Sit-up", "Abdominal com anilha", "Abdominal com braços estendidos", "Abdominal na bola suíça", "Abdominal remador", "Abdominal canivete", "V-up", "Toe touch", "Elevação de pernas deitado", "Elevação de pernas na barra", "Elevação de joelhos na barra", "Elevação de joelhos na paralela", "Reverse crunch", "Abdominal infra no banco", "Ab wheel", "Rollout com barra", "Rollout na bola suíça",
    "Prancha lateral", "Prancha lateral com elevação do quadril", "Abdominal bicicleta", "Russian twist", "Woodchopper na polia alta", "Woodchopper na polia baixa", "Rotação de tronco na máquina", "Rotação na polia", "Abdominal oblíquo no banco", "Flexão lateral com halter", "Flexão lateral na polia", "Suitcase carry", "Copenhagen plank", "Mountain climber cruzado", "Windshield wiper", "Landmine rotation",
    "Prancha frontal", "Prancha com braços estendidos", "Prancha com carga", "Prancha com toque nos ombros", "Prancha com deslocamento", "Dead bug", "Bird dog", "Hollow body hold", "Pallof press", "Pallof press ajoelhado", "Pallof press com rotação", "Farmer walk", "Suitcase carry", "Overhead carry", "Bear crawl", "Turkish get-up", "Renegade row", "Body saw", "Stir the pot na bola suíça", "Marcha com kettlebell"
  ],
  'full-body': [
    "Levantamento terra", "Terra com trap bar", "Agachamento com desenvolvimento", "Thruster com halteres", "Thruster com barra", "Clean", "Power clean", "Hang clean", "Clean and press", "Snatch com barra", "Snatch com halter", "Kettlebell swing", "Kettlebell clean", "Kettlebell snatch", "Turkish get-up", "Farmer walk", "Empurrar trenó", "Puxar trenó", "Battle rope", "Burpee sem flexão de peito", "Box jump", "Agachamento com salto", "Avanço com salto", "Step-up explosivo", "Salto horizontal", "Salto unilateral", "Medicine ball slam", "Wall ball", "Bear crawl", "Caminhada do fazendeiro"
  ],
  cardio: [
    "Esteira — caminhada", "Esteira — corrida", "Esteira inclinada", "Bicicleta ergométrica vertical", "Bicicleta horizontal", "Bicicleta de spinning", "Elíptico", "Simulador de escada", "Remo ergométrico", "Ski erg", "Air bike", "Transport", "Stepper", "Trenó motorizado", "Corda naval", "Corda de pular"
  ]
};

function normalizeName(name) {
  // Remove accents and transform to lowercase for strict matching
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

async function runSeed() {
  console.log('Starting seed...');

  // 1. Upload videos if exist
  const videos = {};
  if (fs.existsSync(PERNA_DIR)) {
    const files = fs.readdirSync(PERNA_DIR);
    for (const file of files) {
      if (file.endsWith('.mp4')) {
        const filePath = path.join(PERNA_DIR, file);
        const fileName = path.parse(file).name;
        
        console.log(`Uploading ${file}...`);
        const fileData = fs.readFileSync(filePath);
        
        const { data, error } = await supabase.storage
          .from('exercises')
          .upload(file, fileData, {
            contentType: 'video/mp4',
            upsert: true
          });
          
        if (error) {
          console.error(`Error uploading ${file}:`, error);
        } else {
          const { data: publicUrlData } = supabase.storage.from('exercises').getPublicUrl(file);
          videos[normalizeName(fileName)] = publicUrlData.publicUrl;
          console.log(`Uploaded! URL: ${publicUrlData.publicUrl}`);
        }
      }
    }
  }

  let insertedCount = 0;

  for (const [category, exList] of Object.entries(exercisesData)) {
    for (let rawName of exList) {
      const name = rawName.toUpperCase(); // Following standard
      const nName = normalizeName(rawName);
      
      let videoUrl = null;
      // Try to match video by exact or partial name
      for (const [vName, vUrl] of Object.entries(videos)) {
        if (nName.includes(vName) || vName.includes(nName) || vName === nName || name.toLowerCase().includes(vName.toLowerCase())) {
          videoUrl = vUrl;
          break;
        }
        if (vName.includes('belt squat') && nName.includes('belt squat')) videoUrl = vUrl;
        if (vName.includes('leg press 45') && nName.includes('leg press 45')) videoUrl = vUrl;
      }

      const { data, error } = await supabase.from('exercises').insert({
        name: name,
        target_muscle: category,
        video_url: videoUrl,
        instructions: null
      });

      if (error) {
        console.error(`Failed to insert ${name}:`, error.message);
      } else {
        insertedCount++;
      }
    }
  }

  console.log(`Successfully inserted ${insertedCount} exercises!`);
}

runSeed();
