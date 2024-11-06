//Webflow html
 
/* <canvas id="canvas"> </canvas>
<style> 
#canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: -1;
}
 
</style> */
 
 
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script>
    // Configurações
    const particleCount = 20;        // Número de partículas
    const radius = 40;               // Raio base das partículas
    const thickness = 1;             // Espessura das partículas
    const noiseIntensity = 0.5;      // Intensidade do ruído
    const noiseSize = 0.2;           // Tamanho do ruído
    const speed = 0.015;             // Velocidade de rotação
    const pathVariation = 40;        // Variação do caminho das partículas
    const maxPnChange = 15 * noiseIntensity; // Mudança máxima permitida pelo ruído
 
    // Configuração do Canvas
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
 
    // Função para converter graus em radianos
    function radian(deg) { return (deg * Math.PI) / 180; }
 
    // Ajusta o canvas para ocupar a tela inteira
    function makeCanvasFullscreen() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    makeCanvasFullscreen();
    window.addEventListener("resize", makeCanvasFullscreen);
 
    // Classe Circle para animação das partículas
    class Circle {
        constructor(r, thickness, particleCount, pathVariation) {
            this.r = r;                               // Raio base
            this.thickness = thickness;               // Espessura das partículas
            this.particleCount = particleCount;       // Número de partículas
            this.pathVariation = pathVariation;       // Variação do caminho
            this.points = [];                         // Array para armazenar as partículas
            this.makePoints();                        // Inicializa as partículas
        }
 
        makePoints() {
            // Cria os pontos das partículas
            this.points = [];
            for (let i = 0; i < 360; i += 360 / this.particleCount) {
                let deg = radian(i);                          // Ângulo em radianos
                let offset = Math.random() * this.pathVariation; // Deslocamento aleatório
                let baseRadius = this.r + offset;             // Raio com deslocamento
                let grayValue = Math.floor(Math.random() * 256); // Valor de cinza para a cor
                let color = `rgb(${grayValue}, ${grayValue}, ${grayValue})`; // Cor da partícula
 
                this.points.push({
                    deg,                                        // Ângulo atual
                    r: baseRadius,                              // Raio atual
                    xChange: Math.sin(deg) * baseRadius,        // Deslocamento em X
                    yChange: Math.cos(deg) * baseRadius,        // Deslocamento em Y
                    xPn: 0,                                     // Ruído em X
                    yPn: 0,                                     // Ruído em Y
                    mouse: { x: 0, y: 0 },                      // Posição do mouse
                    offset: offset,                             // Deslocamento inicial
                    color: color                                // Cor da partícula
                });
            }
        }
 
        updatePoints(rotate = speed) {
            // Atualiza os pontos das partículas
            this.points.forEach((point) => {
                point.deg += rotate; // Incrementa o ângulo
                let randomPathVariation = Math.sin(point.deg * 2 + point.offset) * this.pathVariation; // Variação aleatória
                point.r = this.r + randomPathVariation;  // Atualiza o raio
                point.xChange = Math.sin(point.deg) * point.r; // Atualiza X
                point.yChange = Math.cos(point.deg) * point.r; // Atualiza Y
 
                // Adiciona ruído aleatório
                point.xPn += (Math.random() * 2 - 1) * noiseSize;
                point.yPn += (Math.random() * 2 - 1) * noiseSize;
                // Limita o ruído máximo permitido
                point.xPn = Math.max(Math.min(point.xPn, maxPnChange), -maxPnChange);
                point.yPn = Math.max(Math.min(point.yPn, maxPnChange), -maxPnChange);
            });
        }
 
        draw() {
            // Desenha as partículas no canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.points.forEach((point) => {
                ctx.beginPath();
                ctx.fillStyle = point.color; // Define a cor da partícula
                let x = point.mouse.x + point.xChange + point.xPn; // Posição X final
                let y = point.mouse.y + point.yChange + point.yPn; // Posição Y final
                ctx.arc(x, y, this.thickness, 0, 2 * Math.PI, false); // Desenha o círculo
                ctx.fill(); // Preenche o círculo
                ctx.closePath();
            });
        }
    }
 
    const shape = new Circle(radius, thickness, particleCount, pathVariation); // Instancia a classe Circle
 
    // Movimento do mouse
    document.body.addEventListener('mousemove', (e) => {
        const mouse = { x: e.clientX, y: e.clientY }; // Posição atual do mouse
        shape.points.forEach((point) => {
            // Anima a posição das partículas em direção ao mouse usando GSAP
            gsap.to(point.mouse, {
                x: mouse.x,
                y: mouse.y,
                duration: 0.3,
                ease: "power2.out",
                delay: (point.yPn + point.xPn + maxPnChange * 0.5) * 0.015, // Atraso baseado no ruído
            });
        });
    });
 
    // Efeito de hover nos links
    function handleLinkHover(scaleDown) {
        // Ajusta o tamanho das partículas ao passar o mouse sobre um link
        gsap.to(shape, {
            thickness: scaleDown ? thickness * 0.5 : thickness, // Diminui ou restaura a espessura
            r: scaleDown ? radius * 0.1 : radius,               // Diminui ou restaura o raio
            duration: 0.3,
            ease: "power2.out",
        });
    }
 
    // Interação de hover para todos os links
    document.querySelectorAll("a").forEach((link) => {
        link.addEventListener("mouseover", () => handleLinkHover(true));  // Quando o mouse entra no link
        link.addEventListener("mouseout", () => handleLinkHover(false));  // Quando o mouse sai do link
    });
 
    // Loop de animação
    function animate() {
        shape.draw();           // Desenha as partículas
        shape.updatePoints();   // Atualiza as partículas
        requestAnimationFrame(animate); // Chama a próxima frame de animação
    }
    animate(); // Inicia a animação
</script>
