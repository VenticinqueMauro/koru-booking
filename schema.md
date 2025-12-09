[
  {
    "key": "accentColor",
    "schema": {
      "type": "string",
      "default": "#00C896",
      "required": false,
      "description": "Color principal del widget (formato Hex, ej: #00C896)"
    }
  },
  {
    "key": "displayMode",
    "schema": {
      "enum": [
        "inline",
        "modal"
      ],
      "type": "string",
      "default": "modal",
      "required": false,
      "description": "Modo de visualización: 'inline' para embebido, 'modal' para botón flotante"
    }
  },
  {
    "key": "triggerText",
    "schema": {
      "type": "string",
      "default": "Reservar ahora",
      "required": false,
      "description": "Texto del botón disparador (solo aplica en modo modal)"
    }
  },
  {
    "key": "triggerPosition",
    "schema": {
      "enum": [
        "bottom-right",
        "bottom-left",
        "top-right",
        "top-left"
      ],
      "type": "string",
      "default": "bottom-right",
      "required": false,
      "description": "Esquina donde se ubicará el botón flotante (solo modo modal)"
    }
  },
  {
    "key": "offsetX",
    "schema": {
      "type": "number",
      "min": 0,
      "max": 200,
      "default": 24,
      "required": false,
      "description": "Distancia horizontal desde el borde (píxeles)"
    }
  },
  {
    "key": "offsetY",
    "schema": {
      "type": "number",
      "min": 0,
      "max": 200,
      "default": 24,
      "required": false,
      "description": "Distancia vertical desde el borde (píxeles)"
    }
  }
]
