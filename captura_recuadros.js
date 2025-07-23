const puppeteer = require('puppeteer');

(async () => {
  const url = 'https://www.amazon.com/gp/bestsellers/home-garden/ref=zg_bs_home-garden_sm';
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Espera a que los recuadros estén presentes
  await page.waitForSelector('.zg-grid-general-faceout');

  // Selecciona todos los recuadros de producto
  const cards = await page.$$('.zg-grid-general-faceout');

  const fs = require('fs');
  // Extrae el nombre de la categoría desde la URL (por ejemplo: 'home-garden')
  const categoria = url.split('/gp/bestsellers/')[1].split('/')[0] || 'categoria';
  // Carpeta destino por categoría
  const baseDir = 'capturas_productos';
  const dir = `${baseDir}/${categoria}`;
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir);
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  // Array para guardar info de productos
  const productos = [];
  for (let i = 0; i < cards.length; i++) {
    // Obtiene el nombre del producto para el archivo
    const title = await cards[i].$eval('._cDEzb_p13n-sc-css-line-clamp-3_g3dy1', el => el.textContent.trim().replace(/[\\/:*?\"<>|]/g, '').replace(/\s+/g, '_').substring(0, 60));
    // Obtiene el enlace del producto
    let enlace = '';
    try {
      enlace = await cards[i].$eval('a', el => el.href);
    } catch (e) {
      enlace = url;
    }
    // Agrega el tag de afiliado
    if (enlace.includes('?')) {
      enlace += `&tag=realowomichis-20`;
    } else {
      enlace += `?tag=realowomichis-20`;
    }
    // Obtiene el bounding box y ajusta el área con margen extra
    const boundingBox = await cards[i].boundingBox();
    // Márgenes reducidos: izquierda 10px, arriba 10px, derecha 5px, abajo 5px
    const left = 10, top = 10, right = 5, bottom = 5;
    const clip = {
      x: Math.max(boundingBox.x - left, 0),
      y: Math.max(boundingBox.y - top, 0),
      width: boundingBox.width + left + right,
      height: boundingBox.height + top + bottom
    };
    const imgName = `producto_${i+1}_${title}.png`;
    await page.screenshot({ path: `${dir}/${imgName}`, clip });
    productos.push({
      nombre: title,
      imagen: `${imgName}`,
      enlace: enlace
    });
    console.log(`Capturado: ${dir}/${imgName}`);
  }
  // Guarda el JSON de productos en la carpeta de la categoría
  fs.writeFileSync(`${dir}/productos.json`, JSON.stringify(productos, null, 2), 'utf8');

  await browser.close();
})();
