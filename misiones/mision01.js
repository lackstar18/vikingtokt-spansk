ES.mision({
  "id": 1,
  "titulo": "Landgangen",
  "es": "El desembarco",
  "tema": "Hilsener og å si hvem du er",
  "oleadas": [
    {
      "tipo": "grito",
      "titulo": "Krigsrop",
      "info": "Lytt. Velg hva det betyr.",
      "cuantos": 8,
      "items": [
        ["Hola", "Hei"],
        ["Adiós", "Ha det"],
        ["Buenos días", "God morgen"],
        ["Buenas tardes", "God ettermiddag"],
        ["Buenas noches", "God kveld / god natt"],
        ["Gracias", "Takk"],
        ["Por favor", "Vær så snill"],
        ["Perdón", "Unnskyld"],
        ["Sí", "Ja"],
        ["¿Qué tal?", "Hvordan går det?"],
        ["Encantado", "Hyggelig å møte deg"],
        ["Hasta luego", "Vi ses"]
      ]
    },
    {
      "tipo": "runa",
      "titulo": "Runen for «å være»",
      "texto": [
        "På norsk: jeg er, du er, han er. Ett ord for alle.",
        "På spansk bytter ordet: soy (jeg er), eres (du er), es (han / hun er).",
        "På spansk sløyfer man som regel yo (jeg). Soy sier allerede at det er deg."
      ],
      "ejemplos": [
        ["Soy de Noruega.", "Jeg er fra Norge."],
        ["¿Eres de España?", "Er du fra Spania?"],
        ["Rodrigo es capitán.", "Rodrigo er kaptein."]
      ]
    },
    {
      "tipo": "carrera",
      "titulo": "Byttejakt",
      "info": "45 sekunder. Disse ordene kan du allerede. Ta så mange du klarer!",
      "segundos": 45,
      "items": [
        ["hotel", "hotell"],
        ["restaurante", "restaurant"],
        ["taxi", "taxi"],
        ["música", "musikk"],
        ["chocolate", "sjokolade"],
        ["idea", "idé"],
        ["información", "informasjon"],
        ["problema", "problem"],
        ["fantástico", "fantastisk"],
        ["perfecto", "perfekt"],
        ["tomate", "tomat"],
        ["fútbol", "fotball"],
        ["teléfono", "telefon"],
        ["familia", "familie"],
        ["universidad", "universitet"],
        ["café", "kaffe"],
        ["banco", "bank"],
        ["vikingo", "viking"],
        ["museo", "museum"],
        ["teatro", "teater"],
        ["guitarra", "gitar"],
        ["minuto", "minutt"],
        ["elefante", "elefant"],
        ["policía", "politi"]
      ]
    },
    {
      "tipo": "forja",
      "titulo": "Smi setningen",
      "info": "Klikk ordene i riktig rekkefølge.",
      "cuantos": 4,
      "items": [
        ["Me llamo Ragnar.", "Jeg heter Ragnar."],
        ["Soy de Noruega.", "Jeg er fra Norge."],
        ["¿Cómo te llamas?", "Hva heter du?"],
        ["¿De dónde eres?", "Hvor er du fra?"],
        ["Muy bien, gracias.", "Veldig bra, takk."],
        ["Buenos días, ¿qué tal?", "God morgen, hvordan går det?"]
      ]
    }
  ],
  "jefe": {
    "nombre": "Capitán Rodrigo",
    "titulo": "Havnekapteinen",
    "vida": 100,
    "entra": "¡Alto, vikingo!",
    "entra_no": "Stopp, viking!",
    "rondas": [
      { "dice": "¿Quién eres?", "no": "Hvem er du?", "ok": "Soy {nombre}.", "malas": ["Gracias.", "Adiós."] },
      { "dice": "¿De dónde eres?", "no": "Hvor er du fra?", "ok": "Soy de Noruega.", "malas": ["Me llamo Noruega.", "Buenas noches."] },
      { "dice": "¿Cómo te llamas?", "no": "Hva heter du? (skriv svaret)", "escribe": true, "pista": "Me llamo ..." },
      { "dice": "¿Qué tal?", "no": "Hvordan går det?", "ok": "Bien, gracias. ¿Y tú?", "malas": ["Por favor.", "Sí, perdón."] },
      { "dice": "Encantado. Bienvenido a España.", "no": "Hyggelig å møte deg. Velkommen til Spania.", "ok": "Encantado.", "malas": ["Hasta luego, perdón.", "No."] }
    ],
    "gana": "¡Bah! Puedes pasar, vikingo.",
    "gana_no": "Bah! Du kan passere, viking.",
    "pierde": "¡Fuera de mi puerto!",
    "pierde_no": "Ut av havnen min!",
    "bonus": {
      "dice": "Háblame de ti, vikingo.",
      "no": "Fortell meg om deg selv, viking.",
      "tarea": "Skriv 1–2 setninger på spansk om deg selv. Bruk det du kan: Me llamo …, Soy de …",
      "contexto": "Oppdrag 1: hilse og presentere seg (navn og land), nivå A1"
    }
  },
  "burla": "¡Ja, ja! ¡Este campamento es mío!",
  "burla_no": "Ha ha! Denne leiren er min!"
});
