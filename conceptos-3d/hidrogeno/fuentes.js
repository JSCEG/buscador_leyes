// Las fuentes de la planta de hidrógeno, en un solo lugar: las muestra la figura junto a sus gráficas y las cita su ficha de
// Aprende (src/data/como-funciona.js). `para` dice en lenguaje sencillo qué respalda cada una.
const consulta = '8 de noviembre de 2026';

export const FUENTES = [
    { autor: 'U.S. Department of Energy', fecha: 'sin fecha', titulo: 'Hydrogen Production: Electrolysis', url: 'https://www.energy.gov/eere/fuelcells/hydrogen-production-electrolysis', consulta, para: 'Cómo el electrolizador parte el agua' },
    { autor: 'U.S. Department of Energy', fecha: '14 de agosto de 2013', titulo: 'Fuel Cells', url: 'https://www.energy.gov/eere/fuelcells/fuel-cells', consulta, para: 'Cómo la celda de combustible da electricidad, agua y calor' },
    { autor: 'Comisión Europea', fecha: '8 de julio de 2020', titulo: 'A hydrogen strategy for a climate-neutral Europe (COM/2020/301)', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52020DC0301', consulta, para: 'Qué se considera hidrógeno renovable' },
    { autor: 'Mey, A., U.S. Energy Information Administration', fecha: '12 de febrero de 2021', titulo: 'Utility-scale batteries and pumped storage return about 80% of the electricity they store', url: 'https://www.eia.gov/todayinenergy/detail.php?id=46756', consulta, para: 'Cuánta energía regresan las baterías' },
    { autor: 'Penev, M., National Renewable Energy Laboratory', fecha: '24 de marzo de 2021', titulo: 'H2IQ Hour: Long-Duration Energy Storage Using Hydrogen and Fuel Cells', url: 'https://www.energy.gov/eere/fuelcells/h2iq-hour-long-duration-energy-storage-using-hydrogen-and-fuel-cells-text', consulta, para: 'Guardar energía varios días con hidrógeno' },
    { autor: 'Benreguieg, A., Montuori, L. y Vannella, L.', fecha: '14 de septiembre de 2026', titulo: 'Methane Pyrolysis: Current Technologies and Limitations in Transforming Natural Gas into Low-Emission Hydrogen', editorial: 'IntechOpen', url: 'https://www.intechopen.com/online-first/1253785', consulta, para: 'Pirólisis: hidrógeno, carbono sólido y fugas de metano' },
];
