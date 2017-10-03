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
    if (document.title !== UNIT_TEST_WEBTITLE)  // to avoid the execution of the algorithm interfaces during a Unit-Test
        needlemanWunsch.startNeedlemanWunsch();
});

(function () {  // namespace
    // public methods
    namespace("needlemanWunsch", startNeedlemanWunsch, NeedlemanWunsch,
        setIO, compute, initializeMatrix, computeMatrixAndScore, recursionFunction, computeTraceback);

    // instances
    var alignmentInstance;
    var needlemanWunschInstance;

    /**
     * Function managing objects.
     */
    function startNeedlemanWunsch() {
        imports();

        var alignmentInterface = new interfaces.alignmentInterface.AlignmentInterface();
        alignmentInterface.startAlignmentAlgorithm(NeedlemanWunsch);
    }

    function imports() {
        $.getScript(PATHS.ALIGNMENT_INTERFACE);
        $.getScript(PATHS.ALIGNMENT);
    }

    /*---- ALGORITHM ----*/
    /**
     * Computes the optimal, global alignment.
     * @constructor
     */
    function NeedlemanWunsch() {
        needlemanWunschInstance = this;

        // variables
        this.type = ALGORITHMS.NEEDLEMAN_WUNSCH;

        // inheritance
        alignmentInstance = new procedures.bases.alignment.Alignment(this);

        this.setInput = alignmentInstance.setInput;
        this.compute = alignmentInstance.compute;
        this.getOutput = alignmentInstance.getOutput;

        this.setIO = alignmentInstance.setIO;

        // public methods (linking)
        this.initializeMatrix = initializeMatrix;
        this.computeMatrixAndScore = computeMatrixAndScore;
        this.recursionFunction = recursionFunction;
        this.computeTraceback = computeTraceback;
    }

    // inheritance
    function setIO(input, output) {
        alignmentInstance.setIO(input, output);
    }

    function compute() {
        return alignmentInstance.compute();
    }

    // methods
    function initializeMatrix() {
        var inputData = alignmentInstance.getInput();
        var outputData = alignmentInstance.getOutput();

        // initialize
        outputData.matrix[0][0] = 0;

        for (var i = 1; i < inputData.matrixHeight; i++)
            outputData.matrix[i][0] = outputData.matrix[i - 1][0] + inputData.deletion;

        for (var j = 1; j < inputData.matrixWidth; j++)
            outputData.matrix[0][j] = outputData.matrix[0][j - 1] + inputData.insertion;

        alignmentInstance.setIO(inputData, outputData);
    }

    function computeMatrixAndScore() {
        var inputData = alignmentInstance.getInput();
        var outputData = alignmentInstance.getOutput();

        for (var i = 1; i < inputData.matrixHeight; i++) {
            var bChar = inputData.sequenceB[i - 1];

            for (var j = 1; j < inputData.matrixWidth; j++) {
                var aChar = inputData.sequenceA[j - 1];

                outputData.matrix[i][j] = alignmentInstance.recursionFunction(aChar, bChar, i, j);
            }
        }

        outputData.score = outputData.matrix[inputData.matrixHeight - 1][inputData.matrixWidth - 1];

        alignmentInstance.setIO(inputData, outputData);
    }

    function recursionFunction(diagonalValue, upValue, leftValue) {
        var inputData = alignmentInstance.getInput();

        var value;
        if (inputData.calculationType === ALIGNMENT_TYPES.DISTANCE)
            value = Math.min(diagonalValue, upValue, leftValue);
        else  // inputData.calculationType === ALIGNMENT_TYPES.SIMILARITY
            value = Math.max(diagonalValue, upValue, leftValue);

        return value;
    }

    function computeTraceback() {
        var inputData = alignmentInstance.getInput();
        var outputData = alignmentInstance.getOutput();

        var lowerRightCorner = new procedures.backtracking.Vector(inputData.matrixHeight - 1, inputData.matrixWidth - 1);
        var backtracking = new procedures.backtracking.Backtracking();

        var path = [];
        path.push(lowerRightCorner);
        outputData.tracebackPaths = backtracking.backtrace(needlemanWunschInstance, path, inputData, outputData, -1);

        alignmentInstance.setIO(inputData, outputData);
    }
}());