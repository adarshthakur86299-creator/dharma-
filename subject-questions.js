'use strict';

(() => {
  const formatNumber = (value) => Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
  const uniqueChoices = (answer, distractors) => {
    const choices = [...new Set([String(answer), ...distractors.map(String)])];
    let fallback = 1;
    while (choices.length < 4) {
      const candidate = `Option ${fallback}`;
      if (!choices.includes(candidate)) choices.push(candidate);
      fallback += 1;
    }
    return choices.slice(0, 4);
  };
  const makeQuestion = (prompt, correct, distractors, explanation, tip, index) => {
    const choices = uniqueChoices(correct, distractors);
    const answerIndex = (index * 7 + 3) % 4;
    const options = choices.filter((choice) => choice !== String(correct));
    options.splice(answerIndex, 0, String(correct));
    return { prompt, options, answer: answerIndex, explanation, tip };
  };
  const numericChoices = (answer, unit = '', step = 1) => [
    `${formatNumber(answer - step)}${unit}`,
    `${formatNumber(answer + step)}${unit}`,
    `${formatNumber(answer + 2 * step)}${unit}`
  ];
  const fraction = (numerator, denominator) => {
    const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
    const divisor = gcd(numerator, denominator) || 1;
    return `${numerator / divisor}/${denominator / divisor}`;
  };

  function makeMathQuestions() {
    const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37], [11, 60, 61], [28, 45, 53], [16, 63, 65]];
    return Array.from({ length: 100 }, (_, index) => {
      const type = Math.floor(index / 10);
      const n = index % 10;
      if (type === 0) {
        const first = n + 2;
        const difference = 3 + n % 5;
        const answer = first + 4 * difference;
        return makeQuestion(`Find the next term: ${first}, ${first + difference}, ${first + 2 * difference}, ${first + 3 * difference}, ?`, answer, [answer - difference, answer + difference, answer + 2 * difference], `The sequence increases by ${difference} each time, so the next term is ${answer}.`, 'Check the difference between consecutive terms before calculating the next term.', index);
      }
      if (type === 1) {
        const root = n + 2;
        const coefficient = n % 4 + 2;
        const constant = n + 3;
        const total = coefficient * root + constant;
        return makeQuestion(`Solve for x: ${coefficient}x + ${constant} = ${total}.`, root, [root - 1, root + 1, root + 2], `Subtract ${constant} from both sides and divide by ${coefficient}: x = ${root}.`, 'Undo addition or subtraction first, then divide by the coefficient of x.', index);
      }
      if (type === 2) {
        const firstRoot = n + 1;
        const secondRoot = n + 4;
        const answer = firstRoot * secondRoot;
        return makeQuestion(`What is the product of the roots of x² - ${firstRoot + secondRoot}x + ${answer} = 0?`, answer, numericChoices(answer), `For x² + bx + c = 0, the product of the roots is c; here it is ${answer}.`, 'Use the product-of-roots formula c/a instead of solving both roots.', index);
      }
      if (type === 3) {
        const [opposite, adjacent, hypotenuse] = triples[n];
        const answer = `${adjacent}/${hypotenuse}`;
        return makeQuestion(`In a right triangle, the opposite and adjacent sides to θ are ${opposite} and ${adjacent}; the hypotenuse is ${hypotenuse}. Find cos θ.`, answer, [`${opposite}/${hypotenuse}`, `${adjacent}/${opposite}`, `${hypotenuse}/${adjacent}`], `Cosine is adjacent over hypotenuse, so cos θ = ${answer}.`, 'Remember SOH-CAH-TOA: cosine uses adjacent divided by hypotenuse.', index);
      }
      if (type === 4) {
        const power = n % 5 + 2;
        const x = n % 4 + 2;
        const answer = power * x ** (power - 1);
        return makeQuestion(`If f(x) = x^${power}, what is f′(${x})?`, answer, numericChoices(answer), `The power rule gives f′(x) = ${power}x^${power - 1}; substituting ${x} gives ${answer}.`, 'Apply the power rule first, then substitute the given x-value.', index);
      }
      if (type === 5) {
        const coefficient = n + 1;
        const upper = n + 2;
        const answer = coefficient * upper * upper / 2;
        return makeQuestion(`Evaluate the definite integral ∫₀^${upper} ${coefficient}x dx.`, formatNumber(answer), numericChoices(answer), `An antiderivative is ${coefficient}x²/2. Evaluating from 0 to ${upper} gives ${formatNumber(answer)}.`, 'Integrate x to x²/2, then substitute the upper and lower limits.', index);
      }
      if (type === 6) {
        const [x, y, distance] = triples[n];
        return makeQuestion(`What is the distance from (0, 0) to (${x}, ${y})?`, distance, [x + y, distance + 1, distance - 1], `The distance is √(${x}² + ${y}²) = ${distance}.`, 'Use the distance formula and look for a Pythagorean triple.', index);
      }
      if (type === 7) {
        const red = n + 1;
        const blue = n + 3;
        const answer = fraction(red, red + blue);
        return makeQuestion(`A bag contains ${red} red and ${blue} blue balls. What is the probability of drawing a red ball?`, answer, numericChoices(red / (red + blue)), `There are ${red} favourable outcomes among ${red + blue} equally likely outcomes, giving ${answer}.`, 'Probability is favourable outcomes divided by the total number of outcomes.', index);
      }
      if (type === 8) {
        const total = n + 5;
        const answer = total * (total - 1) / 2;
        return makeQuestion(`How many ways can 2 people be selected from a group of ${total}?`, answer, [total * (total - 1), total * (total + 1) / 2, total + (total - 1)], `The number of pairs is ᶰC₂ = ${total}(${total - 1})/2 = ${answer}.`, 'For selecting an unordered pair, divide n(n−1) by 2.', index);
      }
      const a = n + 2;
      const b = n + 1;
      const c = n + 3;
      const d = n + 4;
      const answer = a * d - b * c;
      return makeQuestion(`Find the determinant of [[${a}, ${b}], [${c}, ${d}]].`, answer, [a * d + b * c, a + d, b + c], `For a 2×2 matrix, the determinant is ad − bc = ${a}×${d} − ${b}×${c} = ${answer}.`, 'For [[a,b],[c,d]], calculate ad first and subtract bc.', index);
    });
  }

  function makePhysicsQuestions() {
    return Array.from({ length: 100 }, (_, index) => {
      const type = Math.floor(index / 10);
      const n = index % 10;
      const m = n + 2;
      if (type === 0) {
        const acceleration = n + 1;
        const answer = m * acceleration;
        return makeQuestion(`A ${m} kg object accelerates at ${acceleration} m/s². What is the net force?`, `${answer} N`, numericChoices(answer, ' N'), `Newton’s second law gives F = ma = ${m}×${acceleration} = ${answer} N.`, 'Use F = ma and keep the SI unit newton.', index);
      }
      if (type === 1) {
        const force = n + 3;
        const distance = n + 2;
        const answer = force * distance;
        return makeQuestion(`A constant force of ${force} N moves an object ${distance} m in its direction. How much work is done?`, `${answer} J`, numericChoices(answer, ' J'), `Work = force × displacement = ${force}×${distance} = ${answer} J.`, 'When force and motion are aligned, work is F×d.', index);
      }
      if (type === 2) {
        const mass = n + 1;
        const velocity = n + 2;
        const answer = mass * velocity * velocity / 2;
        return makeQuestion(`Find the kinetic energy of a ${mass} kg object moving at ${velocity} m/s.`, `${formatNumber(answer)} J`, numericChoices(answer, ' J', 2), `Kinetic energy = ½mv² = ½×${mass}×${velocity}² = ${formatNumber(answer)} J.`, 'Square the speed before multiplying by half the mass.', index);
      }
      if (type === 3) {
        const resistance = n + 2;
        const current = n + 1;
        const voltage = resistance * current;
        return makeQuestion(`A ${voltage} V source is connected across a ${resistance} Ω resistor. What current flows?`, `${current} A`, numericChoices(current, ' A'), `Ohm’s law gives I = V/R = ${voltage}/${resistance} = ${current} A.`, 'Use I = V/R; divide voltage by resistance.', index);
      }
      if (type === 4) {
        const first = n + 1;
        const second = n + 3;
        const answer = first + second;
        return makeQuestion(`Two resistors of ${first} Ω and ${second} Ω are connected in series. Find the equivalent resistance.`, `${answer} Ω`, numericChoices(answer, ' Ω'), `Series resistances add: ${first} + ${second} = ${answer} Ω.`, 'In series, add the resistances directly.', index);
      }
      if (type === 5) {
        const frequency = (n + 1) * 10;
        const wavelength = (n + 2) / 10;
        const answer = frequency * wavelength;
        return makeQuestion(`A wave has frequency ${frequency} Hz and wavelength ${formatNumber(wavelength)} m. What is its speed?`, `${formatNumber(answer)} m/s`, numericChoices(answer, ' m/s', 2), `Wave speed v = fλ = ${frequency}×${formatNumber(wavelength)} = ${formatNumber(answer)} m/s.`, 'Multiply frequency by wavelength; hertz times metres gives m/s.', index);
      }
      if (type === 6) {
        const volume = n + 1;
        const mass = n + 2;
        const answer = mass / volume;
        return makeQuestion(`A sample has mass ${mass} kg and volume ${volume} m³. What is its density?`, `${formatNumber(answer)} kg/m³`, numericChoices(answer, ' kg/m³'), `Density = mass/volume = ${mass}/${volume} = ${formatNumber(answer)} kg/m³.`, 'Density is mass divided by volume.', index);
      }
      if (type === 7) {
        const mass = n + 2;
        const velocity = n + 1;
        const answer = mass * velocity;
        return makeQuestion(`What is the momentum of a ${mass} kg object moving at ${velocity} m/s?`, `${answer} kg·m/s`, numericChoices(answer, ' kg·m/s'), `Momentum p = mv = ${mass}×${velocity} = ${answer} kg·m/s.`, 'Momentum is mass multiplied by velocity.', index);
      }
      if (type === 8) {
        const area = n + 1;
        const force = n + 3;
        const answer = force / area;
        return makeQuestion(`A force of ${force} N acts uniformly over an area of ${area} m². What pressure is produced?`, `${answer} Pa`, numericChoices(answer, ' Pa'), `Pressure = force/area = ${force}/${area} = ${answer} Pa.`, 'Pressure is force per unit area.', index);
      }
      const time = n + 1;
      const work = (n + 2) * 5;
      const answer = work / time;
      return makeQuestion(`A machine does ${work} J of work in ${time} s. What is its power?`, `${answer} W`, numericChoices(answer, ' W'), `Power = work/time = ${work}/${time} = ${answer} W.`, 'Power measures the rate of doing work: P = W/t.', index);
    });
  }

  const ELEMENTS = [
    ['Hydrogen', 'H', 1, 1], ['Helium', 'He', 2, 4], ['Lithium', 'Li', 3, 7], ['Beryllium', 'Be', 4, 9], ['Boron', 'B', 5, 11],
    ['Carbon', 'C', 6, 12], ['Nitrogen', 'N', 7, 14], ['Oxygen', 'O', 8, 16], ['Fluorine', 'F', 9, 19], ['Neon', 'Ne', 10, 20]
  ];
  const COMPOUNDS = [
    ['H₂O', 18], ['CO₂', 44], ['NH₃', 17], ['CH₄', 16], ['NaCl', 58.5],
    ['O₂', 32], ['HCl', 36.5], ['CaCO₃', 100], ['H₂SO₄', 98], ['NaOH', 40]
  ];
  const ISOTOPES = [
    ['carbon-12', 6, 12], ['carbon-14', 6, 14], ['oxygen-16', 8, 16], ['oxygen-18', 8, 18], ['sodium-23', 11, 23],
    ['magnesium-24', 12, 24], ['aluminium-27', 13, 27], ['silicon-28', 14, 28], ['chlorine-35', 17, 35], ['calcium-40', 20, 40]
  ];
  const BONDS = [
    ['NaCl', 'ionic'], ['MgO', 'ionic'], ['H₂', 'non-polar covalent'], ['Cl₂', 'non-polar covalent'], ['HCl', 'polar covalent'],
    ['H₂O', 'polar covalent'], ['CH₄', 'non-polar covalent'], ['CO₂', 'covalent'], ['Cu', 'metallic'], ['diamond', 'covalent network']
  ];
  const OXIDATION = [
    ['H₂O', '−2'], ['CO₂', '+4'], ['NaCl', '−1'], ['NH₃', -3], ['HCl', '−1'],
    ['SO₂', '+4'], ['MgO', '−2'], ['CH₄', -4], ['H₂S', '−2'], ['Na₂O', '−2']
  ];
  const CATALYSTS = [
    ['Haber process for ammonia', 'iron'], ['Contact process for sulfuric acid', 'vanadium(V) oxide'],
    ['hydrogenation of vegetable oils', 'nickel'], ['decomposition of hydrogen peroxide', 'manganese dioxide'],
    ['Ostwald process for nitric acid', 'platinum-rhodium'], ['polymerisation of ethene', 'Ziegler–Natta catalyst'],
    ['catalytic cracking of petroleum', 'zeolite'], ['manufacture of methanol from synthesis gas', 'copper-zinc oxide'],
    ['hydrogenation of an alkene', 'palladium'], ['conversion of carbon monoxide in a catalytic converter', 'platinum']
  ];

  function makeChemistryQuestions() {
    return Array.from({ length: 100 }, (_, index) => {
      const type = Math.floor(index / 10);
      const n = index % 10;
      if (type === 0) {
        const [name, symbol, atomicNumber] = ELEMENTS[n];
        return makeQuestion(`How many protons are in an atom of ${name}?`, atomicNumber, numericChoices(atomicNumber), `The atomic number of ${name} (${symbol}) is ${atomicNumber}; atomic number equals proton count.`, 'The atomic number is the number of protons in the nucleus.', index);
      }
      if (type === 1) {
        const [isotope, atomicNumber, massNumber] = ISOTOPES[n];
        const neutrons = massNumber - atomicNumber;
        return makeQuestion(`How many neutrons are in a ${isotope} atom?`, neutrons, numericChoices(neutrons), `Neutrons = mass number − atomic number = ${massNumber}−${atomicNumber} = ${neutrons}.`, 'Subtract the atomic number from the mass number to find neutrons.', index);
      }
      if (type === 2) {
        const [name, symbol, atomicNumber] = ELEMENTS[n];
        const candidates = ELEMENTS.filter((element) => element[1] !== symbol).slice(0, 3).map((element) => element[0]);
        return makeQuestion(`Which element has the chemical symbol ${symbol}?`, name, candidates, `${symbol} is the chemical symbol for ${name}, whose atomic number is ${atomicNumber}.`, 'Learn element symbols together with their names; some symbols come from Latin names.', index);
      }
      if (type === 3) {
        const [formula, answer] = COMPOUNDS[n];
        return makeQuestion(`What is the molar mass of ${formula}? Use H=1, C=12, N=14, O=16, Na=23, S=32, Cl=35.5, Ca=40.`, `${formatNumber(answer)} g/mol`, numericChoices(answer, ' g/mol', 2), `Adding the atomic masses represented in ${formula} gives ${formatNumber(answer)} g/mol.`, 'Multiply each element’s atomic mass by its subscript, then add the totals.', index);
      }
      if (type === 4) {
        const ph = n + 2;
        const answer = ph < 7 ? 'acidic' : ph > 7 ? 'basic' : 'neutral';
        return makeQuestion(`At 25°C, how would a solution with pH ${ph} be classified?`, answer, ['acidic', 'basic', 'neutral', 'amphoteric'], `At 25°C, pH below 7 is acidic, pH 7 is neutral, and pH above 7 is basic; ${ph} is ${answer}.`, 'Compare pH with 7: below is acidic, equal is neutral, above is basic.', index);
      }
      if (type === 5) {
        const [formula, answer] = BONDS[n];
        const alternatives = ['ionic', 'polar covalent', 'non-polar covalent', 'metallic', 'covalent', 'covalent network'].filter((item) => item !== answer).slice(0, 3);
        return makeQuestion(`Which description best fits the bonding in ${formula}?`, answer, alternatives, `${formula} is best described as having ${answer} bonding.`, 'Check whether electrons are transferred, shared, or delocalised across a metal.', index);
      }
      if (type === 6) {
        const [formula, answer] = OXIDATION[n];
        return makeQuestion(`What is the oxidation number of the non-hydrogen element in ${formula}?`, answer, ['−2', '−1', '0', '+2'].filter((value) => value !== String(answer)).slice(0, 3), `Using the usual oxidation-number rules, the non-hydrogen element has oxidation number ${answer} in ${formula}.`, 'Use charge neutrality together with common oxidation-number rules.', index);
      }
      if (type === 7) {
        const moles = n + 1;
        const answer = moles * 22.4;
        return makeQuestion(`At STP, what volume is occupied by ${moles} mol of an ideal gas? Use 22.4 L/mol.`, `${formatNumber(answer)} L`, numericChoices(answer, ' L', 2), `At STP, 1 mol occupies 22.4 L, so ${moles} mol occupies ${moles}×22.4 = ${formatNumber(answer)} L.`, 'At STP, multiply the amount in moles by 22.4 litres per mole.', index);
      }
      if (type === 8) {
        const moles = n + 1;
        const volume = n + 2;
        const answer = moles / volume;
        return makeQuestion(`What is the molarity of ${moles} mol of solute dissolved to make ${volume} L of solution?`, `${formatNumber(answer)} M`, numericChoices(answer, ' M', 0.5), `Molarity = moles/litres of solution = ${moles}/${volume} = ${formatNumber(answer)} M.`, 'Use M = n/V, with volume expressed in litres.', index);
      }
      const [process, answer] = CATALYSTS[n];
      const alternatives = [...new Set(CATALYSTS.map((item) => item[1]).filter((item) => item !== answer))].slice(0, 3);
      return makeQuestion(`Which catalyst is commonly used in the ${process}?`, answer, alternatives, `${answer} is commonly used as a catalyst in the ${process}.`, 'Remember common industrial catalysts by pairing each catalyst with its named process.', index);
    });
  }

  function makeQuantitativeQuestions() {
    return Array.from({ length: 100 }, (_, index) => {
      const type = Math.floor(index / 10);
      const n = index % 10;
      if (type === 0) {
        const base = (n + 2) * 100;
        const percent = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75][n];
        const answer = base * percent / 100;
        return makeQuestion(`What is ${percent}% of ${base}?`, answer, numericChoices(answer, '', Math.max(1, percent / 5)), `${percent}% of ${base} is ${base}×${percent}/100 = ${answer}.`, 'Convert the percentage to a simple fraction or find 10% first.', index);
      }
      if (type === 1) {
        const a = n + 2;
        const b = n + 4;
        const total = (a + b) * (n + 3);
        const answer = a * (n + 3);
        return makeQuestion(`Two amounts are in the ratio ${a}:${b} and total ${total}. What is the smaller amount?`, answer, [b * (n + 3), answer + a, answer - a], `There are ${a + b} parts; each part is ${total}/${a + b} = ${n + 3}. The smaller amount is ${answer}.`, 'Add the ratio parts, divide the total by that sum, then multiply by the required part.', index);
      }
      if (type === 2) {
        const time = n + 2;
        const speed = (n + 3) * 10;
        const distance = speed * time;
        return makeQuestion(`A vehicle travels ${distance} km in ${time} hours. What is its average speed?`, `${speed} km/h`, numericChoices(speed, ' km/h', 5), `Average speed = distance/time = ${distance}/${time} = ${speed} km/h.`, 'Divide total distance by total time, and keep the units consistent.', index);
      }
      if (type === 3) {
        const principal = (n + 2) * 1000;
        const rate = n + 2;
        const years = n % 3 + 1;
        const answer = principal * rate * years / 100;
        return makeQuestion(`Find the simple interest on ₹${principal} at ${rate}% per year for ${years} year(s).`, `₹${formatNumber(answer)}`, numericChoices(answer, ' rupees', Math.max(10, rate * 5)), `SI = PRT/100 = ${principal}×${rate}×${years}/100 = ₹${formatNumber(answer)}.`, 'Use SI = principal × rate × time ÷ 100.', index);
      }
      if (type === 4) {
        const values = [n + 10, n + 20, n + 30, n + 40];
        const answer = values.reduce((sum, value) => sum + value, 0) / values.length;
        return makeQuestion(`What is the average of ${values.join(', ')}?`, answer, numericChoices(answer), `Their sum is ${values.reduce((sum, value) => sum + value, 0)}; dividing by 4 gives ${answer}.`, 'Pair the smallest with the largest; their midpoint helps find the mean quickly.', index);
      }
      if (type === 5) {
        const marked = (n + 2) * 100;
        const discountRate = n + 5;
        const answer = marked * (100 - discountRate) / 100;
        return makeQuestion(`An item marked at ₹${marked} has a ${discountRate}% discount. What is its sale price?`, `₹${formatNumber(answer)}`, numericChoices(answer, ' rupees', 10), `Discount = ₹${marked}×${discountRate}/100. Subtracting it leaves ₹${formatNumber(answer)}.`, 'Calculate the discount, then subtract it from the marked price.', index);
      }
      if (type === 6) {
        const firstDays = n + 2;
        const secondDays = n + 3;
        const answer = firstDays * secondDays / (firstDays + secondDays);
        return makeQuestion(`Worker A can finish a job in ${firstDays} days and worker B in ${secondDays} days. How long do they take working together?`, `${formatNumber(answer)} days`, [formatNumber(answer + 1), formatNumber(answer + 2), formatNumber(Math.max(1, answer - 1))], `Their combined daily rate is 1/${firstDays} + 1/${secondDays}; the time is ${formatNumber(answer)} days.`, 'Add the workers’ one-day work rates, then take the reciprocal.', index);
      }
      if (type === 7) {
        const cost = (n + 2) * 100;
        const rate = n + 5;
        const answer = cost * (100 + rate) / 100;
        return makeQuestion(`An article costs ₹${cost} and is sold at a ${rate}% profit. What is its selling price?`, `₹${formatNumber(answer)}`, numericChoices(answer, ' rupees', 10), `Selling price = cost × (100 + profit%)/100 = ₹${formatNumber(answer)}.`, 'Add the profit percentage to 100% of the cost price.', index);
      }
      if (type === 8) {
        const length = (n + 2) * 10;
        const time = n + 1;
        const answer = length / time;
        return makeQuestion(`A ${length} m train passes a pole in ${time} seconds. What is its speed?`, `${formatNumber(answer)} m/s`, numericChoices(answer, ' m/s', 2), `Passing a pole covers one train length: speed = ${length}/${time} = ${formatNumber(answer)} m/s.`, 'Convert the train length and time to matching units, then divide.', index);
      }
      const principal = (n + 2) * 100;
      const rate = 10;
      const answer = principal * ((1 + rate / 100) ** 2 - 1);
      return makeQuestion(`What compound interest is earned on ₹${principal} for 2 years at 10% per year, compounded annually?`, `₹${formatNumber(answer)}`, numericChoices(answer, ' rupees', 10), `Amount = ${principal}×1.1² = ₹${formatNumber(principal + answer)}; compound interest is ₹${formatNumber(answer)}.`, 'For two years, compound the amount twice; subtract the original principal.', index);
    });
  }

  const ANALOGIES = [
    ['Book', 'read', 'food', 'eat', 'wear', 'drive', 'sleep'], ['Thermometer', 'temperature', 'ruler', 'length', 'weight', 'speed', 'time'],
    ['Bird', 'nest', 'bee', 'hive', 'stable', 'web', 'burrow'], ['Puppy', 'dog', 'kitten', 'cat', 'horse', 'sheep', 'wolf'],
    ['Pen', 'write', 'knife', 'cut', 'measure', 'stitch', 'paint'], ['Eye', 'see', 'ear', 'hear', 'smell', 'taste', 'touch'],
    ['Carpenter', 'wood', 'tailor', 'cloth', 'glass', 'leather', 'stone'], ['Bee', 'honey', 'silkworm', 'silk', 'milk', 'wool', 'wax'],
    ['Tuesday', 'Wednesday', 'Friday', 'Saturday', 'Monday', 'Sunday', 'Thursday'], ['Finger', 'hand', 'toe', 'foot', 'arm', 'leg', 'wrist']
  ];
  const LOGIC_SETS = [
    ['All tulips are flowers. No flower is a mineral.', 'No tulip is a mineral.', 'All minerals are tulips.', 'Some flowers are minerals.', 'No flower is a tulip.'],
    ['All squares are rectangles. All rectangles have four sides.', 'All squares have four sides.', 'All four-sided shapes are squares.', 'No square is a rectangle.', 'Some rectangles have three sides.'],
    ['No reptile is a mammal. All snakes are reptiles.', 'No snake is a mammal.', 'All mammals are snakes.', 'Some snakes are mammals.', 'No reptile is a snake.'],
    ['All poets are writers. Some writers are teachers.', 'All poets are writers.', 'All teachers are poets.', 'No poet is a writer.', 'All writers are poets.'],
    ['All roses are plants. No plant is made of metal.', 'No rose is made of metal.', 'All metal objects are roses.', 'Some plants are made of metal.', 'No rose is a plant.'],
    ['All buses are vehicles. All vehicles need energy to move.', 'All buses need energy to move.', 'All vehicles are buses.', 'No bus is a vehicle.', 'Some buses do not move.'],
    ['No even number is odd. Every multiple of 4 is even.', 'No multiple of 4 is odd.', 'Every odd number is a multiple of 4.', 'Some even numbers are odd.', 'No multiple of 4 is even.'],
    ['All whales are mammals. No mammal is an insect.', 'No whale is an insect.', 'All insects are whales.', 'Some whales are insects.', 'No mammal is a whale.'],
    ['All chefs can cook. Mira is a chef.', 'Mira can cook.', 'Everyone who can cook is a chef.', 'Mira cannot cook.', 'No chef can cook.'],
    ['No square is a circle. Shape P is a square.', 'Shape P is not a circle.', 'Every circle is a square.', 'Shape P is a circle.', 'No shape is a square.']
  ];

  function makeReasoningQuestions() {
    return Array.from({ length: 100 }, (_, index) => {
      const type = Math.floor(index / 10);
      const n = index % 10;
      if (type === 0) {
        const start = n + 2;
        const difference = n + 3;
        const answer = start + 5 * difference;
        return makeQuestion(`Find the next number: ${start}, ${start + difference}, ${start + 2 * difference}, ${start + 3 * difference}, ${start + 4 * difference}, ?`, answer, [answer - difference, answer + difference, answer + 2 * difference], `The sequence increases by ${difference} each time; the next term is ${answer}.`, 'Compare consecutive terms and identify the repeated change.', index);
      }
      if (type === 1) {
        const jumps = n + 1;
        const positions = [0, jumps, 2 * jumps + 1, 3 * jumps + 3];
        const letters = positions.map((position) => String.fromCharCode(65 + position % 26));
        const nextPosition = positions[3] + jumps + 3;
        const letter = String.fromCharCode(65 + nextPosition % 26);
        const alternatives = [-2, -1, 1].map((offset) => String.fromCharCode(65 + (nextPosition + offset + 26) % 26));
        return makeQuestion(`Find the next letter: ${letters.join(', ')}, ?`, letter, alternatives, `The letter jumps increase by one each time; the next position wraps around the alphabet to ${letter}.`, 'Convert letters to positions, then track the changing jump size.', index);
      }
      if (type === 2) {
        const words = ['CAT', 'DOG', 'SUN', 'MAP', 'PEN', 'BOX', 'CUP', 'HAT', 'RED', 'FOX'];
        const word = words[n];
        const shift = n % 4 + 1;
        const encode = (text, offset) => [...text].map((letter) => String.fromCharCode(65 + (letter.charCodeAt(0) - 65 + offset) % 26)).join('');
        const answer = encode(word, shift);
        return makeQuestion(`If each letter is shifted ${shift} place(s) forward in the alphabet, how is ${word} coded?`, answer, [encode(word, shift + 1), encode(word, shift + 2), encode(word, shift + 3)], `Shift each letter of ${word} forward by ${shift}: the code is ${answer}.`, 'Apply the same alphabet shift to every letter, wrapping from Z to A.', index);
      }
      if (type === 3) {
        const directions = ['North', 'East', 'South', 'West'];
        const start = n % 4;
        const rightTurns = n % 3 + 1;
        const leftTurns = n % 2 + 1;
        const final = directions[(start + rightTurns - leftTurns + 4) % 4];
        const turns = [...Array(rightTurns).fill('right'), ...Array(leftTurns).fill('left')].join(', ');
        return makeQuestion(`A person faces ${directions[start]} and turns ${turns}. Which direction are they facing?`, final, directions.filter((direction) => direction !== final).slice(0, 3), `Each right turn moves clockwise and each left turn anticlockwise; the final direction is ${final}.`, 'Sketch a four-point compass and count each 90-degree turn.', index);
      }
      if (type === 4) {
        const [first, firstRelation, second, answer, ...options] = ANALOGIES[n];
        return makeQuestion(`${first} is to ${firstRelation} as ${second} is to:`, answer, options, `The same relationship gives ${second} → ${answer}.`, 'State the relationship between the first pair, then apply it to the second.', index);
      }
      if (type === 5) {
        const odd = n * 20 + 4;
        const primes = [];
        for (let candidate = odd + 1; primes.length < 4; candidate += 1) {
          if (candidate > 1 && !Array.from({ length: Math.floor(Math.sqrt(candidate)) - 1 }, (_, divisor) => divisor + 2).some((divisor) => candidate % divisor === 0)) primes.push(candidate);
        }
        const numbers = [odd, ...primes];
        return makeQuestion(`Which number is different from the others: ${numbers.join(', ')}?`, odd, primes.slice(0, 3), `${odd} is even and composite; the other listed values are prime.`, 'Test a simple shared property such as divisibility for each number.', index);
      }
      if (type === 6) {
        const first = ['Aarav', 'Mira', 'Rohan', 'Sara', 'Kabir', 'Isha', 'Dev', 'Nina', 'Arjun', 'Tara'][n];
        const second = ['Bela', 'Chetan', 'Diya', 'Eshan', 'Farah', 'Gopal', 'Hina', 'Ilan', 'Jaya', 'Karan'][n];
        return makeQuestion(`${first} is the son of ${second}. ${second} is the sister of ${['Leena', 'Manav', 'Omar', 'Pia', 'Qadir', 'Ritu', 'Samar', 'Tina', 'Uma', 'Vikram'][n]}. How is ${first} related to ${second}’s sibling?`, 'Nephew', ['Uncle', 'Brother', 'Cousin'], `A male child of someone’s sister is that sibling’s nephew.`, 'Draw the family links in order, then identify the relationship from the final person’s view.', index);
      }
      if (type === 7) {
        const total = 2 * n + 15;
        const rank = n + 2;
        const fromBottom = total - rank + 1;
        const suffix = rank % 100 >= 11 && rank % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[rank % 10] || 'th');
        return makeQuestion(`A student is ranked ${rank}${suffix} from the top and there are ${total} students. What is the rank from the bottom?`, fromBottom, [fromBottom - 1, fromBottom + 1, fromBottom + 2], `Rank from bottom = total − rank from top + 1 = ${total}−${rank}+1 = ${fromBottom}.`, 'Subtract the top rank from the total and add one.', index);
      }
      if (type === 8) {
        const base = n + 2;
        const next = base + 1;
        const answer = next * next;
        return makeQuestion(`Find the missing number: ${base * base}, ${(base + 1) * (base + 1)}, ${(base + 2) * (base + 2)}, ?`, answer, [answer - 1, answer + 1, (base + 3) * (base + 3)], `These are consecutive squares; the next is ${next}² = ${answer}.`, 'Check whether the terms are squares of consecutive integers.', index);
      }
      const [statements, answer, ...options] = LOGIC_SETS[n];
      return makeQuestion(`${statements} Which conclusion follows?`, answer, options, `The conclusion must follow from the statements without adding any assumptions: ${answer}`, 'Use only what the statements guarantee; do not assume the reverse is also true.', index);
    });
  }

  const VOCABULARY = [
    ['abundant', 'plentiful', 'scarce'], ['accurate', 'precise', 'incorrect'], ['ancient', 'old', 'modern'], ['brief', 'concise', 'lengthy'], ['calm', 'tranquil', 'agitated'],
    ['candid', 'frank', 'deceptive'], ['diligent', 'industrious', 'lazy'], ['eager', 'keen', 'reluctant'], ['fragile', 'delicate', 'sturdy'], ['genuine', 'authentic', 'counterfeit'],
    ['hostile', 'unfriendly', 'friendly'], ['immense', 'enormous', 'tiny'], ['joyful', 'cheerful', 'miserable'], ['kind', 'benevolent', 'cruel'], ['liberty', 'freedom', 'captivity'],
    ['modest', 'humble', 'arrogant'], ['notion', 'idea', 'certainty'], ['obtain', 'acquire', 'lose'], ['peril', 'danger', 'safety'], ['rapid', 'swift', 'sluggish'],
    ['silent', 'quiet', 'noisy'], ['transform', 'change', 'preserve'], ['unusual', 'strange', 'ordinary'], ['vacant', 'empty', 'occupied'], ['weary', 'tired', 'energetic'],
    ['adapt', 'adjust', 'resist'], ['banish', 'expel', 'welcome'], ['cease', 'stop', 'begin'], ['defend', 'protect', 'attack'], ['essential', 'necessary', 'optional'],
    ['famous', 'renowned', 'unknown'], ['grief', 'sorrow', 'delight'], ['hinder', 'obstruct', 'assist'], ['inspect', 'examine', 'ignore'], ['jeopardy', 'risk', 'security'],
    ['loyal', 'faithful', 'disloyal'], ['mend', 'repair', 'damage'], ['numerous', 'many', 'few'], ['oppose', 'resist', 'support'], ['permit', 'allow', 'forbid'],
    ['reject', 'refuse', 'accept'], ['scarce', 'limited', 'plentiful'], ['temporary', 'brief', 'permanent'], ['urgent', 'pressing', 'unimportant'], ['valuable', 'precious', 'worthless'],
    ['wisdom', 'insight', 'foolishness'], ['yield', 'surrender', 'resist'], ['bold', 'courageous', 'timid'], ['comprehend', 'understand', 'misinterpret'], ['diminish', 'decrease', 'increase']
  ];

  function makeEnglishQuestions() {
    return Array.from({ length: 100 }, (_, index) => {
      const n = index % 50;
      const [word, synonym, antonym] = VOCABULARY[n];
      if (index < 50) {
        const distractors = [antonym, VOCABULARY[(n + 7) % 50][1], VOCABULARY[(n + 19) % 50][1]];
        return makeQuestion(`Choose the synonym of “${word}”.`, synonym, distractors, `“${synonym}” has a meaning closest to “${word}”.`, 'Replace the word in a simple sentence with each option and compare meanings.', index);
      }
      const distractors = [synonym, VOCABULARY[(n + 11) % 50][2], VOCABULARY[(n + 23) % 50][2]];
      return makeQuestion(`Choose the antonym of “${word}”.`, antonym, distractors, `“${antonym}” expresses the opposite of “${word}”.`, 'An antonym has the opposite meaning; eliminate options that are similar in meaning.', index);
    });
  }

  const AWARENESS_FACTS = [
    ['When did the Constitution of India come into effect?', '26 January 1950', ['15 August 1947', '26 November 1949', '2 October 1950'], 'It came into effect on 26 January 1950, celebrated as Republic Day.'],
    ['On which date was the Constitution of India adopted?', '26 November 1949', ['26 January 1950', '15 August 1947', '2 October 1949'], 'The Constituent Assembly adopted the Constitution on 26 November 1949.'],
    ['Who chaired the Drafting Committee of the Indian Constitution?', 'B. R. Ambedkar', ['Rajendra Prasad', 'Jawaharlal Nehru', 'Sardar Vallabhbhai Patel'], 'B. R. Ambedkar chaired the Constitution’s Drafting Committee.'],
    ['Which Article guarantees equality before the law in India?', 'Article 14', ['Article 19', 'Article 21', 'Article 32'], 'Article 14 guarantees equality before the law and equal protection of the laws.'],
    ['Which Article protects life and personal liberty in India?', 'Article 21', ['Article 14', 'Article 17', 'Article 25'], 'Article 21 protects life and personal liberty, subject to the procedure established by law.'],
    ['Which Article is known for the right to constitutional remedies?', 'Article 32', ['Article 21', 'Article 40', 'Article 51A'], 'Article 32 allows people to approach the Supreme Court to enforce fundamental rights.'],
    ['Which Constitutional Amendment added the Fundamental Duties?', '42nd Amendment', ['24th Amendment', '44th Amendment', '52nd Amendment'], 'The 42nd Amendment in 1976 added Fundamental Duties to the Constitution.'],
    ['What is the maximum strength of the Rajya Sabha under the Constitution?', '250', ['238', '245', '552'], 'The Constitution provides for a maximum Rajya Sabha strength of 250 members.'],
    ['How many elected seats are there in the Lok Sabha?', '543', ['545', '550', '552'], 'The Lok Sabha has 543 elected seats.'],
    ['Who was the President of the Constituent Assembly of India?', 'Rajendra Prasad', ['B. R. Ambedkar', 'C. Rajagopalachari', 'Jawaharlal Nehru'], 'Rajendra Prasad presided over the Constituent Assembly.'],
    ['Where did the Revolt of 1857 begin?', 'Meerut', ['Delhi', 'Kanpur', 'Jhansi'], 'The uprising began among sepoys at Meerut in May 1857.'],
    ['In which year was the Indian National Congress founded?', '1885', ['1875', '1905', '1919'], 'The Indian National Congress was founded in 1885.'],
    ['In which year did Gandhi begin the Dandi March?', '1930', ['1920', '1922', '1942'], 'Gandhi began the Salt March to Dandi in 1930.'],
    ['In which year was the Quit India Movement launched?', '1942', ['1930', '1935', '1947'], 'The Quit India Movement was launched in August 1942.'],
    ['In which year was the First Battle of Panipat fought?', '1526', ['1556', '1576', '1761'], 'The First Battle of Panipat was fought in 1526 between Babur and Ibrahim Lodi.'],
    ['In which year was the Battle of Plassey fought?', '1757', ['1764', '1857', '1707'], 'The Battle of Plassey took place in 1757.'],
    ['Which ancient Indian ruler fought the Kalinga War?', 'Ashoka', ['Chandragupta Maurya', 'Samudragupta', 'Harsha'], 'Ashoka fought the Kalinga War and later embraced Buddhism.'],
    ['In which year did the Jallianwala Bagh massacre occur?', '1919', ['1905', '1920', '1931'], 'The massacre at Jallianwala Bagh took place in Amritsar in 1919.'],
    ['In which year did the Non-Cooperation Movement begin?', '1920', ['1915', '1919', '1930'], 'Gandhi launched the Non-Cooperation Movement in 1920.'],
    ['In which year was the Indian National Army reorganised under Subhas Chandra Bose?', '1943', ['1930', '1940', '1945'], 'Subhas Chandra Bose took leadership of and reorganised the INA in 1943.'],
    ['Which is the largest Indian state by area?', 'Rajasthan', ['Madhya Pradesh', 'Maharashtra', 'Uttar Pradesh'], 'Rajasthan is India’s largest state by area.'],
    ['Which is the smallest Indian state by area?', 'Goa', ['Sikkim', 'Tripura', 'Manipur'], 'Goa is the smallest Indian state by area.'],
    ['Which is the highest mountain peak located wholly within India?', 'Nanda Devi', ['Anamudi', 'Guru Shikhar', 'Doddabetta'], 'Nanda Devi is the highest peak located wholly within India; Kangchenjunga lies on the India–Nepal border.'],
    ['Which is the longest river flowing entirely within India?', 'Godavari', ['Ganga', 'Brahmaputra', 'Indus'], 'The Godavari is the longest river whose course lies entirely within India.'],
    ['The Thar Desert is mainly located in which Indian state?', 'Rajasthan', ['Gujarat', 'Punjab', 'Haryana'], 'Most of the Thar Desert in India lies in Rajasthan.'],
    ['Chilika Lake is located in which state?', 'Odisha', ['West Bengal', 'Andhra Pradesh', 'Kerala'], 'Chilika is a brackish-water lagoon on the coast of Odisha.'],
    ['The Lakshadweep Islands are in which body of water?', 'Arabian Sea', ['Bay of Bengal', 'Andaman Sea', 'Indian Ocean south of Sri Lanka'], 'Lakshadweep lies in the Arabian Sea, off India’s southwest coast.'],
    ['The Andaman and Nicobar Islands are in which body of water?', 'Bay of Bengal', ['Arabian Sea', 'Gulf of Kutch', 'Red Sea'], 'The Andaman and Nicobar Islands lie in the Bay of Bengal.'],
    ['Sardar Sarovar Dam is built on which river?', 'Narmada', ['Godavari', 'Krishna', 'Mahanadi'], 'Sardar Sarovar Dam is on the Narmada River.'],
    ['Hirakud Dam is built across which river?', 'Mahanadi', ['Narmada', 'Kaveri', 'Tapti'], 'Hirakud Dam is built across the Mahanadi in Odisha.'],
    ['What is the SI unit of force?', 'newton', ['joule', 'watt', 'pascal'], 'Force is measured in newtons, named after Isaac Newton.'],
    ['What is the SI unit of power?', 'watt', ['joule', 'newton', 'ampere'], 'Power is measured in watts.'],
    ['What is the SI unit of frequency?', 'hertz', ['ohm', 'tesla', 'volt'], 'Frequency is measured in hertz, or cycles per second.'],
    ['What is the SI unit of electrical resistance?', 'ohm', ['volt', 'ampere', 'coulomb'], 'Electrical resistance is measured in ohms.'],
    ['What is the SI unit of electric charge?', 'coulomb', ['ampere', 'volt', 'farad'], 'Electric charge is measured in coulombs.'],
    ['What is the SI unit of energy?', 'joule', ['watt', 'newton', 'pascal'], 'Energy is measured in joules.'],
    ['What is the SI unit of pressure?', 'pascal', ['joule', 'watt', 'tesla'], 'Pressure is measured in pascals, equivalent to newtons per square metre.'],
    ['What is the SI base unit of electric current?', 'ampere', ['coulomb', 'volt', 'ohm'], 'The ampere is the SI base unit for electric current.'],
    ['What is the SI base unit of thermodynamic temperature?', 'kelvin', ['degree Celsius', 'joule', 'mole'], 'The kelvin is the SI base unit of thermodynamic temperature.'],
    ['What is the SI unit of speed?', 'metre per second', ['kilometre', 'second per metre', 'metre per second squared'], 'Speed is distance divided by time, measured in metres per second in SI.'],
    ['What is the chemical symbol for gold?', 'Au', ['Ag', 'Gd', 'Go'], 'Gold’s symbol Au comes from its Latin name, aurum.'],
    ['What is the chemical symbol for sodium?', 'Na', ['S', 'So', 'Sd'], 'Sodium’s symbol Na comes from the Latin name natrium.'],
    ['What is the atomic number of carbon?', '6', ['4', '8', '12'], 'Carbon has six protons, so its atomic number is 6.'],
    ['What is the chemical formula of ozone?', 'O₃', ['O₂', 'CO₂', 'O₄'], 'An ozone molecule contains three oxygen atoms.'],
    ['Which gas makes up the largest share of Earth’s dry atmosphere?', 'Nitrogen', ['Oxygen', 'Carbon dioxide', 'Argon'], 'Nitrogen makes up about 78% of dry air by volume.'],
    ['At what temperature does pure water boil at 1 atmosphere?', '100°C', ['0°C', '50°C', '212°C'], 'At standard atmospheric pressure, pure water boils at 100°C.'],
    ['What is the chemical formula of carbon dioxide?', 'CO₂', ['CO', 'C₂O', 'O₂C₂'], 'Each carbon dioxide molecule contains one carbon atom and two oxygen atoms.'],
    ['What is the chemical symbol for iron?', 'Fe', ['Ir', 'I', 'In'], 'Iron’s symbol Fe comes from the Latin name ferrum.'],
    ['What is the approximate pH of a neutral solution at 25°C?', '7', ['0', '5', '14'], 'At 25°C, a neutral aqueous solution has pH 7.'],
    ['Which gas is used by plants during photosynthesis?', 'Carbon dioxide', ['Oxygen', 'Nitrogen', 'Hydrogen'], 'Plants take in carbon dioxide and use light energy to make sugars during photosynthesis.'],
    ['Which cell organelle is often called the powerhouse of the cell?', 'Mitochondrion', ['Ribosome', 'Golgi apparatus', 'Lysosome'], 'Mitochondria generate much of the cell’s usable energy through respiration.'],
    ['Which pigment absorbs light for photosynthesis in plants?', 'Chlorophyll', ['Haemoglobin', 'Melanin', 'Keratin'], 'Chlorophyll in chloroplasts absorbs light energy for photosynthesis.'],
    ['Which protein in red blood cells carries oxygen?', 'Haemoglobin', ['Insulin', 'Collagen', 'Keratin'], 'Haemoglobin binds and transports oxygen in red blood cells.'],
    ['Which molecule carries most hereditary information in living organisms?', 'DNA', ['Starch', 'Glycogen', 'Cellulose'], 'DNA stores hereditary information in most living organisms.'],
    ['Vitamin C deficiency can cause which disease?', 'Scurvy', ['Rickets', 'Beriberi', 'Night blindness'], 'A prolonged lack of vitamin C can cause scurvy.'],
    ['Vitamin D deficiency in children can cause which disease?', 'Rickets', ['Scurvy', 'Pellagra', 'Anaemia'], 'Vitamin D deficiency can impair bone mineralisation and cause rickets.'],
    ['Which organ produces insulin?', 'Pancreas', ['Liver', 'Kidney', 'Spleen'], 'Insulin is produced by beta cells in the pancreas.'],
    ['How many chambers does the human heart have?', '4', ['2', '3', '5'], 'The human heart has two atria and two ventricles.'],
    ['What is the largest organ of the human body by surface area?', 'Skin', ['Liver', 'Lung', 'Brain'], 'Skin is the body’s largest organ by surface area.'],
    ['What is the functional filtering unit of the kidney?', 'Nephron', ['Neuron', 'Alveolus', 'Osteon'], 'Each kidney contains nephrons that filter blood and form urine.'],
    ['What is the Sun?', 'A star', ['A planet', 'A moon', 'A comet'], 'The Sun is the star at the centre of our solar system.'],
    ['Approximately how long does Earth take to orbit the Sun?', '365.25 days', ['24 hours', '30 days', '687 days'], 'Earth takes about 365.25 days to complete one orbit around the Sun.'],
    ['What is Earth’s natural satellite?', 'The Moon', ['Phobos', 'Europa', 'Titan'], 'The Moon is Earth’s natural satellite.'],
    ['Which planet is commonly called the Red Planet?', 'Mars', ['Venus', 'Mercury', 'Jupiter'], 'Iron-rich dust gives Mars its reddish appearance.'],
    ['Which planet is closest to the Sun?', 'Mercury', ['Venus', 'Earth', 'Mars'], 'Mercury is the innermost planet in the solar system.'],
    ['Which planet is especially known for its prominent ring system?', 'Saturn', ['Mars', 'Venus', 'Mercury'], 'Saturn has the most prominent and extensive visible ring system.'],
    ['Which is the largest planet in the solar system?', 'Jupiter', ['Saturn', 'Earth', 'Neptune'], 'Jupiter is the largest planet in the solar system.'],
    ['What is the name of the galaxy that contains our solar system?', 'Milky Way', ['Andromeda', 'Whirlpool', 'Sombrero'], 'Our solar system is located in the Milky Way galaxy.'],
    ['A light-year is a unit of what?', 'Distance', ['Time', 'Brightness', 'Mass'], 'A light-year is the distance light travels in one year.'],
    ['What was India’s first satellite, launched in 1975?', 'Aryabhata', ['Rohini', 'INSAT-1A', 'Bhaskara-I'], 'Aryabhata was India’s first satellite, launched in 1975.'],
    ['In which year did the Reserve Bank of India begin operations?', '1935', ['1925', '1947', '1950'], 'The RBI began operations on 1 April 1935.'],
    ['Which institution sets India’s policy repo rate?', 'Reserve Bank of India', ['NITI Aayog', 'SEBI', 'Finance Commission'], 'The RBI’s Monetary Policy Committee sets the policy repo rate.'],
    ['What does GDP stand for?', 'Gross Domestic Product', ['General Development Plan', 'Gross Distribution Price', 'Government Debt Position'], 'GDP measures the value of final goods and services produced within an economy.'],
    ['When was GST introduced in India?', '1 July 2017', ['1 April 2016', '26 January 2018', '15 August 2017'], 'India’s Goods and Services Tax came into effect on 1 July 2017.'],
    ['Who issues the one-rupee note in India?', 'Government of India', ['Reserve Bank of India', 'State Bank of India', 'Parliament'], 'The one-rupee note is issued by the Government of India and signed by the Finance Secretary.'],
    ['Which organisation replaced India’s Planning Commission in 2015?', 'NITI Aayog', ['Finance Commission', 'SEBI', 'National Development Council'], 'NITI Aayog was formed in 2015, replacing the Planning Commission.'],
    ['In which year was SEBI established as a non-statutory body?', '1988', ['1975', '1992', '2000'], 'SEBI was established in 1988 and became a statutory body in 1992.'],
    ['Which sector includes farming and fishing?', 'Primary sector', ['Secondary sector', 'Tertiary sector', 'Quaternary sector'], 'The primary sector obtains goods directly from natural resources, including farming and fishing.'],
    ['What generally happens to money’s purchasing power during inflation?', 'It decreases', ['It doubles', 'It stays fixed', 'It becomes unrelated to prices'], 'When the general price level rises, a unit of money typically buys fewer goods and services.'],
    ['In which year was the United Nations founded?', '1945', ['1919', '1939', '1955'], 'The United Nations officially came into existence in October 1945.'],
    ['Where is the headquarters of the United Nations?', 'New York City', ['Geneva', 'Paris', 'Rome'], 'The UN headquarters is in New York City.'],
    ['Where is UNESCO headquartered?', 'Paris', ['Geneva', 'New York City', 'Vienna'], 'UNESCO’s headquarters is in Paris, France.'],
    ['Where is the World Health Organization headquartered?', 'Geneva', ['Paris', 'New York City', 'The Hague'], 'The World Health Organization is headquartered in Geneva, Switzerland.'],
    ['Where is the headquarters of the International Monetary Fund?', 'Washington, D.C.', ['London', 'Geneva', 'Brussels'], 'The IMF is headquartered in Washington, D.C.'],
    ['The ancient Olympic Games originated in which country?', 'Greece', ['Italy', 'Egypt', 'Turkey'], 'The ancient Olympic Games began in Olympia, Greece.'],
    ['Bharatanatyam is a classical dance form associated with which state?', 'Tamil Nadu', ['Punjab', 'Assam', 'Gujarat'], 'Bharatanatyam developed in Tamil Nadu.'],
    ['Bihu is a major festival associated with which state?', 'Assam', ['Kerala', 'Rajasthan', 'Goa'], 'Bihu is a major festival of Assam.'],
    ['Onam is primarily associated with which state?', 'Kerala', ['Bihar', 'Odisha', 'Himachal Pradesh'], 'Onam is a major annual festival of Kerala.'],
    ['In which state is the Great Stupa at Sanchi?', 'Madhya Pradesh', ['Uttar Pradesh', 'Bihar', 'Maharashtra'], 'The Buddhist monuments at Sanchi are in Madhya Pradesh.'],
    ['The Sun Temple at Konark is in which state?', 'Odisha', ['Gujarat', 'Karnataka', 'Tamil Nadu'], 'The Konark Sun Temple is on the coast of Odisha.'],
    ['In which year was Project Tiger launched in India?', '1973', ['1969', '1980', '1992'], 'Project Tiger was launched in 1973 to support tiger conservation.'],
    ['The Chipko movement is most closely associated with which activity?', 'Protecting trees from felling', ['Building dams', 'Saving marine turtles', 'Promoting mining'], 'The Chipko movement used non-violent tree-hugging protests against deforestation.'],
    ['When is World Environment Day observed?', '5 June', ['22 April', '16 September', '21 March'], 'World Environment Day is observed each year on 5 June.'],
    ['When is Earth Day observed internationally?', '22 April', ['5 June', '8 March', '1 December'], 'Earth Day is observed on 22 April.'],
    ['Which was India’s first biosphere reserve, designated in 1986?', 'Nilgiri', ['Nanda Devi', 'Sundarbans', 'Gulf of Mannar'], 'The Nilgiri Biosphere Reserve was India’s first, designated in 1986.'],
    ['Kaziranga National Park is in which state?', 'Assam', ['Gujarat', 'Karnataka', 'Uttarakhand'], 'Kaziranga National Park in Assam is renowned for the one-horned rhinoceros.'],
    ['Gir National Park is especially known for which animal?', 'Asiatic lion', ['Bengal tiger', 'Snow leopard', 'Wild water buffalo'], 'Gir in Gujarat is the principal natural habitat of the Asiatic lion.'],
    ['The Sundarbans mangrove region in India is mainly in which state?', 'West Bengal', ['Odisha', 'Andhra Pradesh', 'Tamil Nadu'], 'The Indian part of the Sundarbans lies in West Bengal.'],
    ['The Ramsar Convention focuses on the conservation of what?', 'Wetlands', ['Deserts', 'Mountains', 'Coral minerals'], 'The Ramsar Convention is an international treaty for the conservation and wise use of wetlands.'],
    ['Which type of compound is a major cause of stratospheric ozone depletion?', 'Chlorofluorocarbons (CFCs)', ['Glucose', 'Calcium carbonate', 'Sodium chloride'], 'Chlorine released from CFCs can catalytically destroy stratospheric ozone.']
  ];

  function makeAwarenessQuestions() {
    return AWARENESS_FACTS.map(([prompt, answer, distractors, explanation], index) =>
      makeQuestion(prompt, answer, distractors, explanation, 'Recall the key fact, then eliminate options from a different topic or category.', index));
  }

  const SUBJECT_QUESTIONS = {
    'jee-mathematics': makeMathQuestions(),
    'jee-physics': makePhysicsQuestions(),
    'jee-chemistry': makeChemistryQuestions(),
    'ssc-quantitative': makeQuantitativeQuestions(),
    'ssc-reasoning': makeReasoningQuestions(),
    'ssc-english': makeEnglishQuestions(),
    'ssc-awareness': makeAwarenessQuestions()
  };

  window.DHARMA_SUBJECT_QUESTIONS = SUBJECT_QUESTIONS;
})();
