# 🚨 Respuestas HTTP Detalladas - Validación OCR

## 📋 Descripción

Se han implementado mensajes de error HTTP detallados y específicos para cada campo que falla en la validación OCR de la cuenta de servicios.

---

## 🔒 Modo de Validación: ESTRICTO

### Requisito Obligatorio

**Se requieren los 3 campos para aprobar la validación:**

- ✅ Nombre del propietario
- ✅ Dirección completa (número + nombre de calle)
- ✅ Comuna

Si falta **cualquiera** de los 3 campos, la validación falla.

---

## 📤 Estructura de Respuesta HTTP

### ❌ Respuesta de Error (400 Bad Request)

```json
{
  "success": false,
  "message": "La validación de la cuenta de servicios falló",
  "errors": [
    "El número de calle no fue encontrado en la cuenta de servicios. Verifica que el número de la dirección sea visible y coincida exactamente con la dirección ingresada.",
    "La comuna no fue encontrada en la cuenta de servicios. Verifica que la comuna esté visible y coincida con la comuna ingresada."
  ],
  "validation": {
    "nombreEncontrado": true,
    "direccionEncontrada": false,
    "comunaEncontrada": false,
    "confianza": "40%",
    "requerimiento": "Se requieren los 3 campos (nombre, dirección y comuna)"
  },
  "datosIngresados": {
    "nombrePropietario": "Juan Carlos Pérez",
    "direccionPropiedad": "Av. Providencia 1234",
    "comuna": "Providencia",
    "region": "Región Metropolitana"
  },
  "sugerencias": [
    "Verifica que la cuenta de servicios esté a nombre del propietario registrado",
    "Asegúrate de que el número de calle sea visible y legible",
    "Confirma que la dirección completa aparezca en el documento",
    "Verifica que la comuna esté claramente especificada",
    "Usa una imagen de alta calidad con buena iluminación"
  ]
}
```

---

## 💬 Mensajes de Error Específicos

### 1. **Nombre del Propietario**

#### ❌ Mensaje cuando NO se encuentra:

```
"El nombre del propietario no se distingue claramente en la cuenta de servicios. Asegúrate de que el nombre esté visible y legible en el documento."
```

#### ✅ Campo encontrado:

- `"nombreEncontrado": true`
- No aparece en `errors[]`

---

### 2. **Dirección - Número de Calle**

#### ❌ Mensaje cuando NO se encuentra el número:

```
"El número de calle no fue encontrado en la cuenta de servicios. Verifica que el número de la dirección sea visible y coincida exactamente con la dirección ingresada."
```

**Casos que generan este error:**

- Dirección ingresada: "Av. Providencia 1234"
- OCR encontró: "Av. Providencia" (sin número)
- OCR encontró: "blanco 8525" (número incorrecto)

---

### 3. **Dirección - Nombre de Calle**

#### ❌ Mensaje cuando NO se encuentra el nombre de calle:

```
"El nombre de la calle no se distingue en la cuenta de servicios. Asegúrate de que la dirección completa esté visible y sea legible en el documento."
```

**Casos que generan este error:**

- Dirección ingresada: "Av. Providencia 1234"
- OCR encontró: "1234" (solo número, sin nombre de calle)

---

### 4. **Comuna**

#### ❌ Mensaje cuando NO se encuentra:

```
"La comuna no fue encontrada en la cuenta de servicios. Verifica que la comuna esté visible y coincida con la comuna ingresada."
```

**Casos que generan este error:**

- Comuna ingresada: "Providencia"
- OCR no encontró: "providencia" ni variantes

#### ✅ Campo encontrado:

- `"comunaEncontrada": true`
- No aparece en `errors[]`

---

## 📊 Ejemplos de Respuestas

### Ejemplo 1: Solo falta el número de calle

```json
{
  "success": false,
  "message": "La validación de la cuenta de servicios falló",
  "errors": [
    "El número de calle no fue encontrado en la cuenta de servicios. Verifica que el número de la dirección sea visible y coincida exactamente con la dirección ingresada."
  ],
  "validation": {
    "nombreEncontrado": true,
    "direccionEncontrada": false,
    "comunaEncontrada": true,
    "confianza": "60%",
    "requerimiento": "Se requieren los 3 campos (nombre, dirección y comuna)"
  }
}
```

### Ejemplo 2: Faltan nombre y dirección

```json
{
  "success": false,
  "message": "La validación de la cuenta de servicios falló",
  "errors": [
    "El nombre del propietario no se distingue claramente en la cuenta de servicios. Asegúrate de que el nombre esté visible y legible en el documento.",
    "El número de calle no fue encontrado en la cuenta de servicios. Verifica que el número de la dirección sea visible y coincida exactamente con la dirección ingresada."
  ],
  "validation": {
    "nombreEncontrado": false,
    "direccionEncontrada": false,
    "comunaEncontrada": true,
    "confianza": "25%",
    "requerimiento": "Se requieren los 3 campos (nombre, dirección y comuna)"
  }
}
```

### Ejemplo 3: Todos los campos faltan

```json
{
  "success": false,
  "message": "La validación de la cuenta de servicios falló",
  "errors": [
    "El nombre del propietario no se distingue claramente en la cuenta de servicios. Asegúrate de que el nombre esté visible y legible en el documento.",
    "El número de calle no fue encontrado en la cuenta de servicios. Verifica que el número de la dirección sea visible y coincida exactamente con la dirección ingresada.",
    "La comuna no fue encontrada en la cuenta de servicios. Verifica que la comuna esté visible y coincida con la comuna ingresada."
  ],
  "validation": {
    "nombreEncontrado": false,
    "direccionEncontrada": false,
    "comunaEncontrada": false,
    "confianza": "0%",
    "requerimiento": "Se requieren los 3 campos (nombre, dirección y comuna)"
  }
}
```

---

## ✅ Respuesta Exitosa (201 Created)

Cuando los 3 campos se encuentran correctamente:

```json
{
  "success": true,
  "message": "Propiedad creada exitosamente",
  "property": {
    "id": 123,
    "title": "Departamento 2D en Providencia",
    "address": "Av. Providencia 1234",
    "utilityBillValidated": true
    // ... otros campos
  }
}
```

---

## 🎯 Beneficios de las Nuevas Respuestas

### Para Usuarios

1. ✅ **Claridad**: Saben exactamente qué faltó en la validación
2. ✅ **Acción**: Instrucciones específicas sobre qué corregir
3. ✅ **Transparencia**: Pueden ver qué campos fueron encontrados

### Para Desarrolladores

1. ✅ **Debugging**: Logs detallados en consola
2. ✅ **Frontend**: Puede mostrar mensajes específicos al usuario
3. ✅ **Monitoreo**: Facilita identificar problemas comunes

### Para Soporte

1. ✅ **Diagnóstico**: Información completa del problema
2. ✅ **Solución**: Pueden guiar al usuario específicamente
3. ✅ **Prevención**: Identifica patrones de errores

---

## 📝 Integración en Frontend

### Mostrar errores específicos:

```typescript
if (!response.ok) {
  const errorData = await response.json();

  // Mostrar cada error específico
  errorData.errors?.forEach((error) => {
    toast({
      title: "Error de validación",
      description: error,
      variant: "destructive",
    });
  });

  // Mostrar estado de validación
  console.log("Estado de validación:", errorData.validation);
}
```

---

## 🔧 Configuración

### Ubicación del código:

- **Generación de mensajes**: `src/services/property/readUtilityBillFromImage.ts`
- **Respuesta HTTP**: `src/controllers/propertyController.ts`
- **Interfaces**: `src/services/property/extractUtilityBillInfo.ts`

### Logs en servidor:

```
📊 Resultado de validación (MODO ESTRICTO): {
  nombreEncontrado: '✅ Sí',
  direccionEncontrada: '❌ No',
  comunaEncontrada: '✅ Sí',
  camposEncontrados: '2/3',
  confianza: '60%',
  esValido: '❌ No válido (requiere 3/3 campos)',
  erroresDetallados: [
    'El número de calle no fue encontrado...'
  ]
}
```

---

## 📅 Fecha de Implementación

**Fecha**: 2 de Octubre, 2025
**Versión**: API Properties v2.2
**Modo**: ESTRICTO (3/3 campos obligatorios)
