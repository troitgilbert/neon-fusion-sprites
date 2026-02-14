

# 🎮 Reliquia del Vacío — Juego de Pelea en React

## Resumen
Juego de pelea 2D estilo arcade con personajes dibujados en Canvas, menú cinematográfico a pantalla completa, y múltiples modos de juego.

---

## 1. Menú Principal (estilo menu_fusionado_v18)
- **Pantalla completa** con fondo de nebulosas animadas, humo, estrellas en movimiento
- **Título "RELIQUIA DEL VACÍO"** con efecto de texto luminoso pulsante (dorado/rojo)
- **Botones laterales izquierdos** con borde neon azul, fondo semitransparente, efecto hover naranja
- **Submenús expandibles** para Versus (Versus / Batalla Libre) y Modos de Juego (Misiones, Eventos, Supervivencia, Boss Rush, Entrenamiento)
- **Panel de info lateral derecho** que muestra la descripción del modo seleccionado
- **Navegación por teclado** (flechas arriba/abajo, Enter para entrar, Escape para volver)
- Opciones: Historia, Arcade, Aventura, Versus, Modos de Juego, Tienda, Extras (Documentos/Logros), Configuración, Salir

## 2. Selección de Personaje
- Pantalla con los personajes disponibles: **Edowado** y **Kaito**
- Selector de skins después de elegir personaje
- Para Versus: selección secuencial P1 → P2

## 3. Selección de Escenario
- Escenarios: Galaxia, Infierno, Cielo, La Nada (desbloqueable en tienda)
- Previsualizaciones con gradientes representativos

## 4. Motor de Pelea (Canvas 640x480)
- **Personajes dibujados en Canvas** con formas geométricas (círculos, rectángulos) — pelo, ropa, ojos, manos animadas
- **Física completa**: gravedad, salto, vuelo (doble tap), dash, fricción, squash & stretch
- **Sistema de combate**: golpe normal, especial, super, ultra, bloqueo, esquiva
- **Sistema de combos** con anunciador (Combo!, Super Combo!, Hyper, Ultra, Extreme)
- **Efectos visuales**: partículas, ondas de choque, screen shake, hit stop, flash de pantalla, scanlines CRT
- **HUD**: barras de HP con skew, 3 segmentos de energía, timer, contador de rondas
- **Proyectiles**: rhombus, homing, bounce
- **Transformación**: Rage Edowado (barra llena)

## 5. Modos de Juego
- **Arcade**: Combates consecutivos, mejor de 3 rondas
- **Supervivencia**: Oleadas infinitas con enemigos cada vez más fuertes
- **Versus Local**: 2 jugadores en el mismo teclado
- **Versus CPU**: Contra IA con agresividad variable
- **Entrenamiento**: Enemigo inmóvil, energía infinita

## 6. Tienda
- **Skins para Kaito**: "El Asesino del ojo por ojo" y "Demonio Blanco" con habilidades únicas
- **Escenarios desbloqueables**: La Nada
- Moneda: cristales ganados al ganar combates
- Inventario persistente en localStorage

## 7. Sistema de Skins con Gameplay
- **Asesino**: dash especial más largo, super = teleport + parálisis
- **Demonio Blanco**: especial = invulnerabilidad temporal, super = teleport, partículas negras

## 8. Controles Táctiles (Móvil)
- D-pad virtual izquierdo + botones de acción derecho
- Detección automática de dispositivo móvil
- Escalado responsive del canvas

## 9. Configuración
- Visualización de controles P1 y P2
- Accesible desde menú principal y desde pausa

