class DiagramaFlujo {
    constructor() {
        this.grafo = {};
        this.numero = 1;  // Para numerar las rutas (como en el código Python)
        this.escenario = 1;  // Para el escenario actual
    }

    agregarNodo(nombre, descripcion) {
        this.grafo[nombre] = { descripcion, conexiones: [] };
    }

    agregarConexion(origen, destino, etiqueta) {
        // Asegurarnos de que el nodo de origen existe antes de agregar una conexión
        if (!this.grafo[origen]) {
            console.error(`Nodo de origen '${origen}' no encontrado en el grafo.`);
            return;
        }
        this.grafo[origen].conexiones.push({ destino, etiqueta });
    }

    generarGraphviz() {
        let dot = 'digraph G {\n';
        dot += '  bgcolor="#23243a";\n'; // Fondo oscuro para el grafo
        dot += '  rankdir=TB;\n'; // Forzar orientación vertical (Top-Bottom)
        dot += '  node [shape=box];\n'; // Cambiar nodos a cuadrados

        // Primero, identificar nodos condicionales (los que tienen conexiones con etiqueta 'Si' o 'No')
        const condicionales = new Set();
        for (const nodo in this.grafo) {
            this.grafo[nodo].conexiones.forEach(conexion => {
                if (conexion.etiqueta && (conexion.etiqueta.trim().toLowerCase() === 'si' || conexion.etiqueta.trim().toLowerCase() === 'no')) {
                    condicionales.add(nodo);
                }
            });
        }

        // Dibujar nodos
        for (const nodo in this.grafo) {
            // Insertar saltos de línea en la descripción para que el texto no sea tan largo
            let label = this.grafo[nodo].descripcion.replace(/(.{40,}?)(,|\s|$)/g, '$1\\n');
            let color = '';
            let shape = condicionales.has(nodo) ? 'shape=diamond' : '';
            // Colores por tipo de nodo
            if (this.grafo[nodo].descripcion.includes('CLIENTE ENVIA')) {
                color = 'style=filled, fillcolor="#b3e5fc", fontcolor="#23243a"'; // celeste pálido
            } else if (
                this.grafo[nodo].descripcion.includes('CHATBOT ENVIA:') ||
                this.grafo[nodo].descripcion.includes('SAM ENVIA:') ||
                this.grafo[nodo].descripcion.includes('ABI ENVIA')
            ) {
                color = 'style=filled, fillcolor="#f9f893ff", fontcolor="#23243a"'; // amarillo pálido
            }
            // Si es condicional, priorizar el color amarillo pálido
            if (condicionales.has(nodo)) {
                color = 'style=filled, fillcolor="#bb92ccff", fontcolor="#0e0d0dff"';
            }
            dot += `  ${nodo} [label="${label}"${shape ? ', ' + shape : ''}${color ? ', ' + color : ''}]\n`;
        }

        // Dibujar conexiones
        for (const nodo in this.grafo) {
            this.grafo[nodo].conexiones.forEach(conexion => {
                dot += `  ${nodo} -> ${conexion.destino} [label="${conexion.etiqueta}", color="#ffffffff", fontcolor="#f7f7fbff"]\n`;
            });
        }

        dot += '}\n';

        return dot;
    }


    dfs(nodo_actual, ruta_actual, visitados) {
        visitados.add(nodo_actual);
        //Inicialmente, la conexión es None
        ruta_actual.push([nodo_actual, null]);
        //verificar si es un nodo final (Fin)
        if (nodo_actual.includes("NFIN")) {
            //Imprimir o almacenar la ruta actual según sea necesario
            let camino = [];
            for (const [nodo, etiqueta] of ruta_actual) {
                camino.push([this.grafo[nodo].descripcion, etiqueta]);
            }
            let tituloFlujo = (`Flujo# ${this.numero}: `);
            for (const [descripcion, etiqueta] of camino) {
                if (etiqueta !== "") {
                    tituloFlujo += descripcion + " " + etiqueta + " -> ";
                }
            }
            console.log(tituloFlujo.replace("null", "") + "\n");
            // Forma correcta de agregar una fila a la tabla rutasBody
            const rutasBody = document.getElementById('rutasBody');
            if (rutasBody) {
                const fila = document.createElement('tr');
                const celdaEscenario = document.createElement('td');
                celdaEscenario.textContent = this.escenario;
                const celdaTitulo = document.createElement('td');
                celdaTitulo.textContent = tituloFlujo.replace("null", "");
                fila.appendChild(celdaEscenario);
                fila.appendChild(celdaTitulo);
                rutasBody.appendChild(fila);
            }
            this.escenario++;  // Incrementar el escenario
            this.numero += 1;  // Incrementar el número de ruta
            for (const [descripcion, etiqueta] of camino) {
                if (descripcion.includes("CLIENTE ENVIA:") || descripcion.includes("CHATBOT ENVIA:") || descripcion.includes("SAM ENVIA:") || descripcion.includes("ABI ENVIA:") || descripcion.includes("VALIDAR:")) {
                    // En lugar de csv.write, si estás escribiendo a la consola:

                    console.log(descripcion + " " + (etiqueta && etiqueta !== "null" ? etiqueta : "").replace("null", ""));
                    // Forma correcta de agregar una fila a la tabla rutasBody para los pasos
                    if (rutasBody) {
                        const filaPaso = document.createElement('tr');
                        const celdaEscenarioPaso = document.createElement('td');
                        celdaEscenarioPaso.textContent = this.escenario;
                        const celdaPaso = document.createElement('td');
                        celdaPaso.textContent = `${descripcion} ${etiqueta ? etiqueta : ""}`;
                        filaPaso.appendChild(celdaEscenarioPaso);
                        filaPaso.appendChild(celdaPaso);
                        rutasBody.appendChild(filaPaso);
                    }
                    this.escenario++;  // Incrementar el escenario
                }
            }
        } else {
            // Recorrer los nodos adyacentes
            for (const { destino, etiqueta } of this.grafo[nodo_actual].conexiones) {
                if (!visitados.has(destino)) {
                    // Actualizar la conexión en el camino
                    ruta_actual[ruta_actual.length - 1] = [nodo_actual, etiqueta];  // Actualizar el último elemento
                    this.dfs(destino, [...ruta_actual], new Set(visitados));
                }
            }
        }
    }
}

// --- NUEVO: Ejecutar funciones al presionar el botón Graficar ---
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('graficarBtn').addEventListener('click', function () {
        // Limpiar tabla de rutas si existe
        const tablaRutas = document.getElementById('rutasTabla').getElementsByTagName('tbody')[0];
        if (tablaRutas) tablaRutas.innerHTML = "";

        // Obtener nodos y conexiones desde los inputs
        const nodosText = document.getElementById('nodosInput').value;
        const conexionesText = document.getElementById('conexionesInput').value;
        const diagrama = new DiagramaFlujo();

        // Agregar nodos: cada línea es un nodo, separado por ;
        nodosText.split('\n').forEach(linea => {
            const partes = linea.split(';');
            if (partes.length >= 2) {
                const nombre = partes[0].trim();
                const descripcion = partes.slice(1).join(';').trim(); // Por si la descripción tiene ;
                if (nombre && descripcion) {
                    diagrama.agregarNodo(nombre, descripcion);
                }
            }
        });

        // Agregar conexiones: cada línea es una conexión, separado por ; o ,
        conexionesText.split('\n').forEach(linea => {
            const partes = linea.split(';');
            if (partes.length >= 2) {
                const origen = partes[0].trim();
                const destino = partes[1].trim();
                const etiqueta = partes[2] ? partes[2].trim() : "";
                if (origen && destino) {
                    diagrama.agregarConexion(origen, destino, etiqueta);
                }
            }
        });

        // Mostrar el código Graphviz generado en el elemento 'diagrama'
        // Mostrar el grafo visualmente usando viz.js
        const graphvizCode = diagrama.generarGraphviz();
        document.getElementById('diagrama').innerHTML = `<div id="graphviz-render"></div>`;
        if (window.Viz) {
            try {
                const viz = new Viz();
                viz.renderSVGElement(graphvizCode)
                    .then(svgElem => {
                        const renderDiv = document.getElementById('graphviz-render');
                        renderDiv.innerHTML = '';
                        renderDiv.appendChild(svgElem);
                        // Hacer el SVG del grafo interactivo: zoom, pan y ajuste inicial
                        function makeSvgZoomable(svgElem) {
                            let isPanning = false, startX, startY, startViewBox;
                            let scale = 1;
                            const svg = svgElem;
                            if (!svg) return;
                            // Ajustar el viewBox para que el grafo se vea completo al inicio
                            if (svg.width && svg.height) {
                                svg.setAttribute('viewBox', `0 0 ${svg.width.baseVal.value} ${svg.height.baseVal.value}`);
                            } else if (svg.getAttribute('width') && svg.getAttribute('height')) {
                                svg.setAttribute('viewBox', `0 0 ${svg.getAttribute('width')} ${svg.getAttribute('height')}`);
                            }
                            // Habilitar pan
                            svg.addEventListener('mousedown', function(e) {
                                isPanning = true;
                                startX = e.clientX;
                                startY = e.clientY;
                                startViewBox = svg.viewBox.baseVal ? {
                                    x: svg.viewBox.baseVal.x,
                                    y: svg.viewBox.baseVal.y,
                                    width: svg.viewBox.baseVal.width,
                                    height: svg.viewBox.baseVal.height
                                } : { x: 0, y: 0, width: svg.width.baseVal.value, height: svg.height.baseVal.value };
                            });
                            svg.addEventListener('mousemove', function(e) {
                                if (!isPanning) return;
                                const dx = (e.clientX - startX) * (startViewBox.width / svg.clientWidth);
                                const dy = (e.clientY - startY) * (startViewBox.height / svg.clientHeight);
                                svg.viewBox.baseVal.x = startViewBox.x - dx;
                                svg.viewBox.baseVal.y = startViewBox.y - dy;
                            });
                            svg.addEventListener('mouseup', function() { isPanning = false; });
                            svg.addEventListener('mouseleave', function() { isPanning = false; });
                            // Habilitar zoom con la rueda del mouse
                            svg.addEventListener('wheel', function(e) {
                                e.preventDefault();
                                const { x, y, width, height } = svg.viewBox.baseVal;
                                const zoomFactor = 1.1;
                                if (e.deltaY < 0) {
                                    // Acercar
                                    svg.viewBox.baseVal.width /= zoomFactor;
                                    svg.viewBox.baseVal.height /= zoomFactor;
                                    svg.viewBox.baseVal.x += (width - svg.viewBox.baseVal.width) / 2;
                                    svg.viewBox.baseVal.y += (height - svg.viewBox.baseVal.height) / 2;
                                } else {
                                    // Alejar
                                    svg.viewBox.baseVal.width *= zoomFactor;
                                    svg.viewBox.baseVal.height *= zoomFactor;
                                    svg.viewBox.baseVal.x -= (svg.viewBox.baseVal.width - width) / 2;
                                    svg.viewBox.baseVal.y -= (svg.viewBox.baseVal.height - height) / 2;
                                }
                            }, { passive: false });
                        }

                        // Botón para nueva ventana (posición fija arriba a la derecha del grafo)
                        function addGraphControls(svgElem) {
                            // Eliminar botón anterior si existe
                            let oldBtn = document.getElementById('btnGraphWindow');
                            if (oldBtn) oldBtn.remove();
                            // Crear contenedor relativo sobre el grafo
                            const renderDiv = document.getElementById('graphviz-render');
                            renderDiv.style.position = 'relative';
                            // Crear botón minimalista
                            const btnWindow = document.createElement('button2');
                            btnWindow.id = 'btnGraphWindow';
                            btnWindow.textContent = '↗';
                            btnWindow.title = 'Abrir en nueva ventana';
                            btnWindow.style.position = 'absolute';
                            btnWindow.style.top = '10px';
                            btnWindow.style.right = '10px';
                            btnWindow.style.zIndex = '10';
                            btnWindow.style.background = '#0a0a31ff';
                            btnWindow.style.color = '#fff';
                            btnWindow.style.border = 'none';
                            btnWindow.style.borderRadius = '90%';
                            btnWindow.style.fontWeight = 'bold';
                            btnWindow.style.fontSize = '18px';
                            btnWindow.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                            btnWindow.style.cursor = 'pointer';
                            btnWindow.onclick = () => {
                                const win = window.open('', '_blank');
                                win.document.write('<html><head><title>Grafo</title></head><body style="background:#23243a;">' + svgElem.outerHTML + '</body></html>');
                            };
                            renderDiv.appendChild(btnWindow);
                        }

                        makeSvgZoomable(svgElem);
                        addGraphControls(svgElem);
                    })
                    .catch(e => {
                        const renderDiv = document.getElementById('graphviz-render');
                        renderDiv.innerHTML = `<span style='color:red'>Error al renderizar el grafo:<br>${e.message || e}</span><pre style='color:#fff;background:#222;padding:8px;'>${graphvizCode}</pre>`;
                    });
            } catch (e) {
                const renderDiv = document.getElementById('graphviz-render');
                renderDiv.innerHTML = `<span style='color:red'>Error al renderizar el grafo:<br>${e.message || e}</span><pre style='color:#fff;background:#222;padding:8px;'>${graphvizCode}</pre>`;
            }
        } else {
            document.getElementById('graphviz-render').innerHTML = '<span style="color:red">viz.js no está cargado.</span>';
        }

        // Ejecutar DFS para encontrar rutas
        const rutaActual = [];
        const visitados = new Set();
        diagrama.dfs('N1', rutaActual, visitados);
    });


    // Llenar los textareas 
    document.getElementById('nodosInput').value = [
        'N1; Solicitud de bloqueo de TC a SAM, CLIENTE ENVIA: Quiero bloquear mi tarjeta de credito',
        'N2; VALIDAR: El cliente tiene un Session ID activo?',
        'N3; SAM pide autenticacion SAM ENVIA: Por motivos de seguridad necesito autenticarte. Podrías brindarme tu número de celular por favor',
        'N4; VALIDAR: Flujo de autenticacion',
        'N5; Datos generales del cliente que el web service debe devolver a SAM',
        'N6; Validar: es cliente de TC?',
        'N7; SAM ENVIA: Adquiere tu Tarjeta de credito',
        'N8; SAM ENVIA: Recuerda que es un bloqueo permanente a tu tarjeta de Credito, no podras hacer compras ¿Deseas continuar?',
        'N9; SAM ENVIA: Si deseas puedes realizar el bloqueo temporal de tu(s) Tarjeta(s) en Banpais por internet. Cualquier duda adicional estoy a la orden',
        'N10; VALIDAR: Tiene mas de una tarjeta de credito?',
        'N11; SAM ENVIA: ¿Cual es el motivo del bloqueo de tu tarjeta? Digita el numero relacionado a tu motivo: 1. Hurto / Robo 2. Extravio 3. Sospecha de fraude 4. Seguridad',
        'N12; CLIENTE ENVIA: Responde peticion',
        'N13; Se realiza el bloqueo por el API de prisma para TC',
        'N14; WS envia informacion a CRM',
        'N15; VALIDAR: Creacion del caso en CRM',
        'N16; VALIDAR: Correo electronico al cliente notiicando el bloqueo de su TC',
        'NFIN17; SAM ENVIA: despedida',
        'N18; SAM ENVIA: Estas son las Tarjetas de Credito que encontre, digita el numero relacionado a la TC que deseas bloquear: 1. Yome Yonatan / CLASICA T 2. Yome Yonatan / UTH T',
        'N19; CLIENTE ENVIA: responde peticion',
        'N20; SAM ENVIA: ¿Cual es el motivo del bloqueo de tu tarjeta? Digita el numero relacionado a tu motivo: 1. Hurto / Robo 2. Extravio 3. Sospecha de fraude 4. Seguridad',
        'N21; CLIENTE ENVIA: Responde peticion',
        'N22; Se realiza el bloqueo por el api de prisma para TC',
        'N23; SAM ENVIA: Deseas bloquear otra TC?'
    ].join('\n');
    document.getElementById('conexionesInput').value = [
        'N1;N2',
        'N2;N3;No',
        'N3;N4',
        'N4;N5',
        'N2;N5;Si',
        'N5;N6',
        'N6;N7;No',
        'N6;N8;Si',
        'N8;N9;No',
        'N8;N10;Si',
        'N10;N11;No',
        'N11;N12',
        'N12;N13',
        'N13;N14',
        'N14;N15',
        'N15;N16',
        'N16;NFIN17',
        'N10;N18',
        'N18;N19',
        'N19;N20',
        'N20;N21',
        'N21;N22',
        'N22;N23',
        'N23;N18;Si',
        'N23;N14;No'
    ].join('\n');
});