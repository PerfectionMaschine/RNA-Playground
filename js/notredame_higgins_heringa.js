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
    if (loaded === ALGORITHMS.NOTREDAME_HIGGINS_HERINGA) {  // to avoid self execution on a script import
        notredameHigginsHeringa.startNotredameHigginsHeringa();
        loaded = ALGORITHMS.NONE;
    }
});

(function () {  // namespace
    // public methods
    namespace("notredameHigginsHeringa", startNotredameHigginsHeringa, NotredameHigginsHeringa,
        getInput, setInput, compute, getOutput, setIO, getSuperclass);

    // instances
    var multiSequenceAlignmentInstance;
    var fengDoolittleInstance;
    var gotohInstance;
    var notredameHigginsHeringaInstance;

    // shared variables
    var inputData = {};  // stores the input of the algorithm
    var outputData = {};  // stores the output of the algorithm

    /**
     * Function managing objects.
     */
    function startNotredameHigginsHeringa() {
        var multiSequenceInterface = new interfaces.multiSequenceInterface.MultiSequenceInterface();
        multiSequenceInterface.startMultiSequenceInterface(NotredameHigginsHeringa, ALGORITHMS.NOTREDAME_HIGGINS_HERINGA);
    }

    /*---- ALGORITHM ----*/
    /**
     * Computes affine multi-alignments (non-optimal approach) with T-Coffee.
     * @constructor
     * @augments Alignment
     * @see: The superclass "alignmentInstance" have to be created as last instance
     * or the childInstance in the superclass will be probably wrong!
     */
    function NotredameHigginsHeringa() {
        notredameHigginsHeringaInstance = this;

        // variables
        this.type = ALGORITHMS.NOTREDAME_HIGGINS_HERINGA;

        // instances (do not change order)
        multiSequenceAlignmentInstance = new bases.multiSequenceAlignment.MultiSequenceAlignment(this);
        fengDoolittleInstance = new fengDoolittle.FengDoolittle();
        gotohInstance = new gotoh.Gotoh();

        // public class methods
        this.getInput = getInput;

        this.setInput = setInput;
        this.compute = compute;
        this.getOutput = getOutput;

        this.setIO = setIO;
        this.getSuperclass = getSuperclass;
    }

    /**
     * Returns the input data of the algorithm.
     * @return {Object} - Contains all input data.
     */
    function getInput() {
        return inputData;
    }

    /**
     * Sets the algorithm input for an appropriate algorithm
     * which is using the inputViewmodel properties in its computations.
     * @param inputViewmodel {Object} - The InputViewmodel of an appropriate algorithm.
     */
    function setInput(inputViewmodel) {
        multiSequenceAlignmentInstance.setIO(inputData, {});
        multiSequenceAlignmentInstance.setInput(inputViewmodel);
    }

    /**
     * Starts the computation.
     */
    function compute() {
        computePrimaryLibraries();
        computeCombinedWeightPrimaryLibrary();
        computeExtendedWeightPrimaryLibrary();
        createProgressiveAlignment();
        return [inputData, outputData];
    }

    /**
     * Computes the set of pairwise alignments for local and global alignments.
     */
    function computePrimaryLibraries() {
        computePairwiseGlobalAlignmentData();
        // computePairwiseLocalAlignmentData();  // if it does not cost too many runtime
    }

    /**
     * Computes scores (similarities),
     * the number of gaps, the alignment lengths
     * and so on between all sequences.
     */
    function computePairwiseGlobalAlignmentData() {
        fengDoolittleInstance.setIO(inputData, outputData);  // todo: move computePairwiseGlobalAlignmentData into multi_sequence_alignment.js
        fengDoolittleInstance.computePairwiseData();
    }

    /**
     * Computes the weights for both libraries
     * and combines both libraries to one big library (signal addition).
     */
    function computeCombinedWeightPrimaryLibrary() {
        computePairwiseWeights();
        //signalAddition();  // if additional pairwise does not cost too many runtime
    }

    /**
     * Computes the sequence identity.
     * So, how much is identical between two sequences
     * with respect to the smaller sequence.
     * Hint: It could be computed during computation of alignment data,
     * but for better understanding and less code complexity
     * everything computed in order defined in the original paper.
     */
    function computePairwiseWeights() {
        for (var i = 0; i < inputData.sequences.length; i++) {
            for (var j = 0; j < i; j++) {
                var sequenceA = inputData.sequences[j];
                var sequenceB = inputData.sequences[i];

                var alignment = outputData.alignmentsAndScores[[sequenceA, sequenceB]];
                var matches = getNumberOfMatches(alignment);
            }
        }
    }

    /**
     * Returns the number of matches in the alignment.
     * @param alignment {[alignedSequenceA, matchOrMismatchString, alignedSequenceB]}
     * - The triple of strings for which the number of gaps has to be computed.
     * @return {number} - The number of matches in the alignment.
     */
    function getNumberOfMatches(alignment) {
    }

    /**
     * The weights in the primary library are recomputed
     * to add consistency-information.
     */
    function computeExtendedWeightPrimaryLibrary() {
    }

    /**
     * Creates a progressive alignment with Feng-Doolittle
     * and the computed, extended weight library.
     */
    function createProgressiveAlignment() {
    }

    /**
     * Returns all algorithm output.
     * @return {Object} - Contains all output of the algorithm.
     */
    function getOutput() {
        return outputData;
    }

    /**
     * Sets the input and output of an algorithm.
     * @param input {Object} - Contains all input data.
     * @param output {Object} - Contains all output data.
     */
    function setIO(input, output) {
        inputData = input;
        outputData = output;
    }

    /**
     * Returns the superclass instance.
     * @return {Object} - Superclass instance.
     */
    function getSuperclass() {
        return multiSequenceAlignmentInstance;
    }
}());