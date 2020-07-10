// JavaScript source code

const canvas = document.getElementById("preview");
const fileInput = document.querySelector('input[type="file"');

const context = canvas.getContext("2d");

const toGrayScale = (r, g, b) => 0.21 * r + 0.72 * g + 0.07 * b;

const convertToGrayScales = (context, width, height) => {
    const imageData = context.getImageData(0, 0, width, height);

    const grayScales = [];

    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];

        const grayScale = toGrayScale(r, g, b);
        imageData.data[i] = imageData.data[i + 1] = imageData.data[
            i + 2
        ] = grayScale;

        grayScales.push(grayScale);
    }

    context.putImageData(imageData, 0, 0);

    return grayScales;
}

//Return height/weight ratio
const getFontRatio = () => {
    const pre = document.createElement("pre");
    pre.style.display = "inline";
    pre.textContent = " ";

    document.body.appendChild(pre);
    const { width, height } = pre.getBoundingClientRect();
    document.body.removeChild(pre);

    return height / width;
};

const fontRatio = getFontRatio();

// ASCII-ize dimensions
const MAXIMUM_WIDTH = 150;
const MAXIMUM_HEIGHT = 150;
const clampDimensions = (width, height) => {

    let rectifiedWidth = Math.floor(getFontRatio() * width);
    let reducedHeight = height;
    if (height > MAXIMUM_HEIGHT) {
        rectifiedWidth = Math.floor((rectifiedWidth * MAXIMUM_HEIGHT) / height);
        reducedHeight = MAXIMUM_HEIGHT;
    }

    if (rectifiedWidth > MAXIMUM_WIDTH) {
        reducedHeight = Math.floor((reducedHeight * MAXIMUM_WIDTH) / rectifiedWidth);
        rectifiedWidth = MAXIMUM_WIDTH;
    }
    let scale = rectifiedWidth / width;

    return [rectifiedWidth, reducedHeight, scale];
};

const grayRamp =
    "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,\"^`'. ";
const rampLength = grayRamp.length;

const getCharacterForGrayScale = grayScale =>
    grayRamp[Math.ceil(((rampLength - 1) * grayScale) / 255)];

const asciiImage = document.querySelector("pre#ascii");

const drawAscii = (grayScales, width) => {
    const ascii = grayScales.reduce((asciiImage, grayScale, index) => {

        let nextChars = getCharacterForGrayScale(grayScale);
        if ((index + 1) % width === 0) {
            nextChars += "\n";
        }

        return asciiImage + nextChars;
    }, "");

    asciiImage.textContent = ascii;
};

fileInput.onchange = e => {
    // just handling single file upload
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = event => {
        const image = new Image();
        image.onload = () => {
            // The image is being stretched to account for the font dimensions, but it's not being resized when the image rotates.
            // Need to frame the image, then ascii-ize it.

            let frameDiam = (image.width < image.height ? image.width : image.height);
            let frameSideLen = frameDiam * Math.SQRT1_2;
            let [width, height, scale] = clampDimensions(image.width, image.height);
            width = image.width * scale; 
            height = image.height * scale;
            frameSideLen = Math.floor(frameSideLen * scale);

            canvas.width = frameSideLen;
            canvas.height = frameSideLen;
            console.log("Width: " + image.width + ", Height: " + image.height)
            console.log("FSL: " + frameSideLen);

            let fps = 1000 / 60;
            let degrees = 0;

            setInterval(function () {
                canvas.hidden = true;
                degrees += 6;
                context.save();

                context.clearRect(0, 0, canvas.width, canvas.height);
                context.translate(frameSideLen / 2, frameSideLen / 2);
                context.rotate(degrees * (Math.PI / 180));
                let horizStretch = 1;
                let vertiStretch = 1;
                context.drawImage(image, -width / 2, -height / 2, width * horizStretch, height * vertiStretch);


                const grayScales = convertToGrayScales(context, frameSideLen, frameSideLen);
                drawAscii(grayScales, frameSideLen);

                context.restore();
            }, fps);
        };

        image.src = event.target.result;
    };

    reader.readAsDataURL(file);
};