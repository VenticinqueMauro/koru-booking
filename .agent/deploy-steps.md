# 🚀 Pasos para Deploy Limpio

## 1. Eliminar dist manualmente ✅ (en progreso)
Elimina la carpeta `dist` completamente desde el explorador de archivos.

## 2. Regenerar dist
```bash
node scripts/copy-dist.js
```

## 3. Deploy con gh-pages
```bash
npx gh-pages -d dist -r https://github.com/VenticinqueMauro/koru-booking.git --dotfiles
```

La opción `--dotfiles` asegura que `.nojekyll` se incluya.

## 4. Verificar
Esperar 2-3 minutos y verificar:
- https://venticinquemauro.github.io/koru-booking/widget/
- https://venticinquemauro.github.io/koru-booking/widget/koru-booking-widget.umd.js

## Alternativa si gh-pages falla

Si `gh-pages` sigue dando error, podemos hacer deploy manual:

```bash
# Crear branch gh-pages limpio
cd dist
git init
git checkout -b gh-pages
git add -A
git commit -m "deploy: widget with Koru SDK"
git remote add origin https://github.com/VenticinqueMauro/koru-booking.git
git push origin gh-pages -f
```
