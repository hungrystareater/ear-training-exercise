"use strict";

let mode = "";
const sampler = new Tone.Sampler({
    urls: {
        "C4": "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        "A4": "A4.mp3",
    },
    release: 1,
    baseUrl: "https://tonejs.github.io/audio/salamander/",
}).toDestination();

const score = {
    currentStreak: 0,
    attempts: 0,
    attemptsCorrect: 0,
    startTime: null,
    stopWatch: null,
    restart: function () {
        this.currentStreak = 0;
        this.attempts = 0;
        this.attemptsCorrect = 0;
        this.startTime = new Date();
    }
};
const key = {
    key: "A",
    table: new Map([
            ["C", 1],
            ["C#", 2],
            ["D", 3],
            ["D#", 4],
            ["E", 5],
            ["F", 6],
            ["F#", 7],
            ["G", 8],
            ["G#", 9],
            ["A", 10],
            ["A#", 11],
            ["B", 12]
        ])
};
const seq = {
    count: 5,
    speed: 500,
    mode: "Minor Pentatonic",
    values: []
};
const noteTable = new Map([
            [1, "C3"],
            [2, "C#3"],
            [3, "D3"],
            [4, "D#3"],
            [5, "E3"],
            [6, "F3"],
            [7, "F#3"],
            [8, "G3"],
            [9, "G#3"],
            [10, "A3"],
            [11, "A#3"],
            [12, "B3"],
            [13, "C4"],
            [14, "C#4"],
            [15, "D4"],
            [16, "D#4"],
            [17, "E4"],
            [18, "F4"],
            [19, "F#4"],
            [20, "G4"],
            [21, "G#4"],
            [22, "A4"],
            [23, "A#4"],
            [24, "B4"],
            [25, "C5"],
            [26, "C#5"],
            [27, "D5"],
            [28, "D#5"],
            [29, "E5"],
            [30, "F5"],
            [31, "F#5"],
            [32, "G5"],
            [33, "G#5"],
            [34, "A5"],
            [35, "A#5"],
            [36, "B5"]
        ]);
//russian localization object, unused but may become used later
const locale = "en";
const translations = {
    "ru": {
        "minor-chord": "Минорный аккорд",
        "major-chord": "Мажорный аккорд",

        "min7-chord": "Минорный септаккорд",
        "maj7-chord": "Mажорный септаккорд",

        "minor-pentatonic": "Минорная пентатоника",
        "major-pentatonic": "Мажорная пентатоника",

        "ionian": "Ионийский",
        "dorian": "Дорийский",
        "phrygian": "Фригийский",
        "lydian": "Лидийский",
        "mixolydian": "Миксолидийский",
        "aeolian": "Эолийский",
        "locrian": "Локрийский",
        "harmonic-minor": "Гармонический минор",
        "phrygian-dominant": "Фригийский доминантный",
        "chromatic": "Хроматика",

        "minor-blues": "Минорный блюз",
        "major-blues": "Мажорный блюз",

        "speed": "Скорость",
        "melody-length": "Длина мелодии: 5",

        "reveal-sequence": "Показать",
        "new-sequence": "Новая",
        "play-again": "Воспроизвести"
    }
};
const modes = new Map();
modes.set("Minor Chord", "100100010000100100010000100100010000");
modes.set("Major Chord", "100010010000100010010000100010010000");
modes.set("Min7 Chord", "100100010010100100010010100100010010");
modes.set("Maj7 Chord", "100010010001100010010001100010010001");
modes.set("Minor Pentatonic", "100101010010100101010010100101010010");
modes.set("Major Pentatonic", "101010010100101010010100101010010100");
modes.set("Ionian", "101011010101101011010101101011010101");
modes.set("Dorian", "101101010110101101010110101101010110");
modes.set("Phrygian", "110101011010110101011010110101011010");
modes.set("Lydian", "101010110101101010110101101010110101");
modes.set("Mixolydian", "101011010110101011010110101011010110");
modes.set("Aeolian", "101101011010101101011010101101011010");
modes.set("Locrian", "110101101010110101101010110101101010");
modes.set("Minor Blues", "100101110010100101110010100101110010");
modes.set("Major Blues", "101110010100101110010100101110010100");
modes.set("Harmonic Minor", "101101011001101101011001101101011001");
modes.set("Phrygian Dominant", "110011011010110011011010110011011010");
modes.set("Chromatic", "111111111111111111111111111111111111");

$(document).ready(initializePage);

function initializePage() {
    $('#display').load('welcome.html', function (responseTxt, statusTxt, xhr) {
        if (statusTxt == "success") {
            $('#exercise').click(startExercise);
            $('#generator').click(openGenerator);
        }
        if (statusTxt == "error")
            $('#display').text("Can't load welcome.html. Error code: " + xhr.status);
    });

    drawKeyboard();

    $('#new-sequence').click(newSequence);
    $('#play-again').click(playSequence);
    $('#restart-exercise').click(restartExercise);
    $('#reveal-sequence').click(revealSequence);
    $('#key-select').change(getKey);
    $('#mode-select').change(getMode);
    $('#speed-range').change(getSpeed);
    $('#melody-length-range').on('input', getMelodyLength);

    $(document).on('keydown', function (event) {
        if (event.key === "Escape") {
            mode = "";
            $('#display').load('welcome.html', function (responseTxt, statusTxt, xhr) {
                if (statusTxt == "success") {
                    $('#exercise').click(startExercise);
                    $('#generator').click(openGenerator);

                    $('#control-panel').find('button').each(function (el) {
                        $(this).hide();
                    });

                    $('#score').html("");
                    clearInterval(score.stopWatch);
                    $('#time').html("");
                }
                if (statusTxt == "error")
                    $('#display').text("Can't load welcome.html. Error code: " + xhr.status);
            });
        }
    });

    //handling clicks on the notes only when they bubble up to the #display div
    $('#display').click(function (event) {
        if (event.target.className == "note" || event.target.className == "note played") {
            if (event.target.id != "") {
                event.target.style.background = "#4361ee";
                score.currentStreak++;
            } else {
                event.target.style.background = "#e63946";
                score.currentStreak = 0;
                score.attempts++;
                mode == "exercise" ? $('#score').html(
`Score: ${score.attemptsCorrect}/${score.attempts}`) : 1;

                revealSequence();

                setTimeout(newSequence, 1500);
            }
            if (score.currentStreak == seq.count) {
                score.currentStreak = 0;
                score.attempts++;
                score.attemptsCorrect++;
                mode == "exercise" ? $('#score').html(
`Score: ${score.attemptsCorrect}/${score.attempts}`) : 1;
                setTimeout(newSequence, 1500);
            }
        }
    });
	
	//incase of translating
    //document.querySelectorAll("[trans-key]").forEach(translateElement);
	
	//incase of testing a new function
	//document.getElementById('test-button').addEventListener('click', testFunction);
}
//incase of testing a new function
//function testFunction() {}


function restartExercise() {
    score.restart();
    newSequence();
    $('#score').html(`Score: ${score.attemptsCorrect}/${score.attempts}`);
}
function startExercise() {
    score.restart();
    mode = "exercise";
    $('#score').html(`Score: ${score.attemptsCorrect}/${score.attempts}`);
    $('#restart-exercise').css("display", "inline");
    $('#play-again').css("display", "inline");

    newSequence();

    score.stopWatch = setInterval(function () {
        let dTime = (new Date()).getTime() - score.startTime.getTime();
        dTime = Math.floor(dTime / 1000);
        $('#time').html(
            `| Time: ${Math.floor(dTime / 60).toString().padStart(2, "0")}:` + 
		`${(dTime % 60).toString().padStart(2, "0")}`);
    }, 1000);
}
function openGenerator() {
    mode = "generator";
    $('#reveal-sequence').css("display", "inline");
    $('#new-sequence').css("display", "inline");
    $('#play-again').css("display", "inline");
    newSequence();
}
function revealSequence() {
    $('.note.played').each(
        function () {
        $(this).css("background", "#4361ee");
    });
}
function translateElement(element) {
    const key = element.getAttribute("trans-key");
    const translation = translations[locale][key];
    element.innerText = translation;
}
function drawKeyboard() {
    $('#keyboard').empty();
    for (let i = 23; i > 0; i--) {
        if (noteTable.get(i + key.table.get(key.key))[1] != '#') {
            $('#keyboard').append(
`<div class='keyboard-key light'>${noteTable.get(i + key.table.get(key.key))}</div>`);
        } else {
            $('#keyboard').append(
`<div class='keyboard-key'>${noteTable.get(i + key.table.get(key.key))}</div>`);
        }
    }
}
function getKey() {
    key.key = this.value;
    drawKeyboard();
}
function getMode() {
    seq.mode = this.value;
}
function getSpeed() {
    seq.speed = 1600 - this.value;
}
function getMelodyLength() {
    seq.count = this.value;
    switch (locale) {
    case "en":
        $('#melody-length-range-label').html(`Melody length: ${this.value.toString()}`);
        break;
    case "ru":
        $('#melody-length-range-label').html(`Длина мелодии: ${this.value.toString()}`);
        break;
    default:
        break;
    }
}
//generates a random pattern of notes within 0-22 interval
//generated melody later is transposed as needed according to the chosen key
function newSequence() {
    let rnd;
    for (let i = 1; i < seq.count - 1; ) {
        rnd = Math.floor(Math.random() * 23);
		//picking only notes from a selected mode
        if (modes.get(seq.mode)[rnd + 1] != '0') {
			//testing new notes to prevent repeating notes and jumps over 11 semitones
            if (seq.values[i - 1] == rnd
                 || Math.abs(rnd - seq.values[i - 1]) > 11
                 || (i == seq.count - 2 && seq.values[seq.count - 1] == rnd)) {
                continue;
            }
            seq.values[i] = rnd;
            i++;
        }
    }
    seq.values[0] = 11;
    seq.values[seq.count - 1] = 11;

    drawSequence();
    playSequence();
}
function playSequence() {
    const now = Tone.now();
    for (let i = 0; i < seq.count; i++) {
        sampler.triggerAttackRelease(
            noteTable.get(seq.values[i] + key.table.get(key.key) + 1),
            seq.speed / 1000,
            now + i * seq.speed / 1000);
    }
}
//fills #display div with the rows of little containers which contain invisible notes
//notes thet are in the melody have different class (note played)
//it also colors the containers according to the black/white key pattern on the piano (sharps are darker)
//when the user clicks notes the event bubbles up to the #display div and only then
//the the handler checks if a note belongs to the generated melody
function drawSequence() {
    let i;
    let k;
    let noteCounter = 0;

    $('#display').empty();

    document.documentElement.style.cssText =
`--note-width: ${(100 / document.getElementById('melody-length-range').value).toPrecision(6)}%`;

    for (i = 0; i < 23; i++) {
        if (seq.values.includes(22 - i)) {
            for (k = 0; k < seq.count; k++) {
                if (seq.values[k] == 22 - i) {
                    if (noteTable.get(23 - i + key.table.get(key.key))[1] === '#') {
                        $('#display').append(
`<div class='note-container dark'><div class='note played' id='note${k}'></div></div>`);
                    } else {
                        $('#display').append(
`<div class='note-container'><div class='note played' id='note${k}'></div></div>`);
                    }
                    noteCounter++;
                } else {
                    if (noteTable.get(23 - i + key.table.get(key.key))[1] === '#') {
                        $('#display').append(
                            "<div class='note-container dark'><div class='note'></div></div>");
                    } else {
                        $('#display').append(
                            "<div class='note-container'><div class='note'></div></div>");
                    }
                }
            }
        } else {
            for (k = 0; k < seq.count; k++) {
                if (noteTable.get(23 - i + key.table.get(key.key))[1] === '#') {
                    $('#display').append(
                        "<div class='note-container dark'><div class='note'></div></div>");
                } else {
                    $('#display').append(
                        "<div class='note-container'><div class='note'></div></div>");
                }
            }
        }
    }
}