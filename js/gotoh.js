/*
University of Freiburg WS 2017/2018
Chair for Bioinformatics
Supervisor: Martin Raden
Author: Alexander Mattheis
*/

"use strict";

/**
 * Defines tasks after page-loading.
 */
$(document).ready(function () {
    debugger;
    if (document.title !== UNIT_TEST_WEBTITLE)  // to avoid the execution of the algorithm interfaces during a Unit-Test
        gotoh.startGotoh();
});

(function () {  // namespace
    // public methods
    namespace("gotoh", startGotoh, Gotoh, getInput, setInput, compute, getOutput, setIO);

    // instances
    var alignmentInstance;
    var gotohInstance;

    // shared variables
    var inputData = {};  // stores the input of the algorithm
    var outputData = {};  // stores the output of the algorithm

    /**
     * Function managing objects.
     */
    function startGotoh() {
        imports();

        var affineAlignmentInterface = new interfaces.affineAlignmentInterface.AffineAlignmentInterface();
        affineAlignmentInterface.startAffineAlignmentAlgorithm(Gotoh);
    }

    function imports() {
        $.getScript(PATHS.AFFINE_ALIGNMENT_INTERFACE);
    }

    /*---- ALGORITHM ----*/
    /**
     * Computes the optimal, global affine alignment.
     * @constructor
     */
    function Gotoh() {
        gotohInstance = this;

        // variables
        this.type = ALGORITHMS.GOTOH;

        // inheritance
        alignmentInstance = new procedures.bases.alignment.Alignment(this);

        this.getInput = getInput;

        this.setInput = setInput;
        this.compute = compute;
        this.getOutput = getOutput;

        this.setIO = setIO;
    }

    function getInput() {
        return inputData;
    }

    function setInput(inputViewmodel) {
        inputData.sequenceA = inputViewmodel.sequence1();
        inputData.sequenceB = inputViewmodel.sequence2();

        inputData.calculationType = inputViewmodel.calculation();

        inputData.baseCosts = inputViewmodel.baseCosts();
        inputData.enlargement = inputViewmodel.enlargement();
        inputData.match = inputViewmodel.match();
        inputData.mismatch = inputViewmodel.mismatch();

        inputData.matrixHeight = inputData.sequenceB.length + 1;
        inputData.matrixWidth = inputData.sequenceA.length + 1;
    }

    function compute() {
        initializeMatrices();
        computeMatricesAndScore();
        computeTraceback();
        createAlignments();
        return [inputData, outputData];
    }

    function initializeMatrices() {
        createMatrices();
        initMatrices();
    }

    function createMatrices() {
        createComputationMatrix();
        createHorizontalGapCostMatrix();
        createVerticalGapCostMatrix();
    }

    function createComputationMatrix() {
        outputData.matrix = new Array(inputData.matrixHeight);

        for (var i = 0; i < inputData.matrixHeight; i++)
            outputData.matrix[i] = new Array(inputData.matrixWidth);
    }

    function createHorizontalGapCostMatrix() {
        outputData.horizontalGaps = new Array(inputData.matrixHeight);

        for (var i = 0; i < inputData.matrixHeight; i++)
            outputData.horizontalGaps[i] = new Array(inputData.matrixWidth);
    }

    function createVerticalGapCostMatrix() {
        outputData.verticalGaps = new Array(inputData.matrixHeight);

        for (var i = 0; i < inputData.matrixHeight; i++)
            outputData.verticalGaps[i] = new Array(inputData.matrixWidth);
    }

    function initMatrices() {
        initComputationMatrix();
        initHorizontalGapCostMatrix();
        initVerticalGapCostMatrix();
    }

    function initComputationMatrix() {
        outputData.matrix[0][0] = 0;

        for (var i = 1; i < inputData.matrixHeight; i++)
            outputData.matrix[i][0] = inputData.baseCosts + i * inputData.enlargement;

        for (var j = 1; j < inputData.matrixWidth; j++)
            outputData.matrix[0][j] = inputData.baseCosts + j * inputData.enlargement
    }

    function initHorizontalGapCostMatrix() {
        for (var i = 1; i < inputData.matrixHeight; i++)
            outputData.horizontalGaps[i][0] = (ALIGNMENT_TYPES.SIMILARITY === inputData.calculationType)
                ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

        for (var j = 1; j < inputData.matrixWidth; j++)
            outputData.horizontalGaps[0][j] = SYMBOLS.GAP;
    }

    function initVerticalGapCostMatrix() {
        for (var i = 1; i < inputData.matrixHeight; i++)
            outputData.verticalGaps[i][0] = SYMBOLS.GAP;

        for (var j = 1; j < inputData.matrixWidth; j++)
            outputData.verticalGaps[0][j] = (ALIGNMENT_TYPES.SIMILARITY === inputData.calculationType)
                ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    }

    function computeMatricesAndScore() {
        for (var i = 1; i < inputData.matrixHeight; i++) {
            var bChar = inputData.sequenceB[i - 1];

            for (var j = 1; j < inputData.matrixWidth; j++) {
                var aChar = inputData.sequenceA[j - 1];

                outputData.matrix[i][j] = recursionFunction(aChar, bChar, i, j);
            }
        }

        outputData.score = outputData.matrix[inputData.matrixHeight - 1][inputData.matrixWidth - 1];
    }

    function recursionFunction(aChar, bChar, i, j) {
        var matchOrMismatch = aChar === bChar ? inputData.match : inputData.mismatch;

        var value;

        if (inputData.calculationType === ALIGNMENT_TYPES.DISTANCE) {
            outputData.horizontalGaps[i][j] = Math.min(
                outputData.horizontalGaps[i][j - 1] + inputData.enlargement,
                outputData.matrix[i][j - 1] + inputData.baseCosts + inputData.enlargement);

            outputData.verticalGaps[i][j] = Math.min(
                outputData.verticalGaps[i - 1][j] + inputData.enlargement,
                outputData.matrix[i - 1][j] + inputData.baseCosts + inputData.enlargement);

            value = Math.min(
                outputData.horizontalGaps[i][j],
                outputData.matrix[i - 1][j - 1] + matchOrMismatch,
                outputData.verticalGaps[i][j]);
        }
        else {  // inputData.calculationType === ALIGNMENT_TYPES.SIMILARITY
            outputData.horizontalGaps[i][j] = Math.max(
                outputData.horizontalGaps[i][j - 1] + inputData.enlargement,
                outputData.matrix[i][j - 1] + inputData.baseCosts + inputData.enlargement);

            outputData.verticalGaps[i][j] = Math.max(
                outputData.verticalGaps[i - 1][j] + inputData.enlargement,
                outputData.matrix[i - 1][j] + inputData.baseCosts + inputData.enlargement);

            value = Math.max(
                outputData.horizontalGaps[i][j],
                outputData.matrix[i - 1][j - 1] + matchOrMismatch,
                outputData.verticalGaps[i][j]);
        }

        return value;
    }

    function computeTraceback() {
        var lowerRightCorner = new procedures.backtracking.Vector(inputData.matrixHeight - 1, inputData.matrixWidth - 1);
        var backtracking = new procedures.backtracking.Backtracking();

        outputData.tracebackPaths = backtracking.backtrace(gotohInstance, [lowerRightCorner], inputData, outputData, -1);
    }

    function createAlignments() {
        alignmentInstance.setIO(inputData, outputData);
        alignmentInstance.createAlignments();
        outputData = alignmentInstance.getOutput();
    }

    function getOutput() {
        return outputData;
    }

    function setIO(input, output) {
        inputData = input;
        outputData = output;
    }
}());