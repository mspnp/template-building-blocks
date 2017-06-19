describe('loadBalancerSettings', () => {
    let rewire = require('rewire');
    //let resources = require('../core/resources.js');
    let loadBalancerSettings = rewire('../core/loadBalancerSettings.js');
    //let _ = require('lodash');
    //let validation = require('../core/validation.js');

    describe('isValidLoadBalancerType', () => {
        let isValidLoadBalancerType = loadBalancerSettings.__get__('isValidLoadBalancerType');
        
        it('undefined', () => {
            expect(isValidLoadBalancerType()).toEqual(false);
        });

        it('null', () => {
            expect(isValidLoadBalancerType(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidLoadBalancerType('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidLoadBalancerType(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidLoadBalancerType(' Public ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidLoadBalancerType('public')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidLoadBalancerType('NOT_VALID')).toEqual(false);
        });

        it('Public', () => {
            expect(isValidLoadBalancerType('Public')).toEqual(true);
        });

        it('Internal', () => {
            expect(isValidLoadBalancerType('Internal')).toEqual(true);
        });
    });

    describe('isValidProtocol', () => {
        let isValidProtocol = loadBalancerSettings.__get__('isValidProtocol');
        
        it('undefined', () => {
            expect(isValidProtocol()).toEqual(false);
        });

        it('null', () => {
            expect(isValidProtocol(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidProtocol('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidProtocol(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidProtocol(' Public ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidProtocol('public')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidProtocol('NOT_VALID')).toEqual(false);
        });

        it('Tcp', () => {
            expect(isValidProtocol('Tcp')).toEqual(true);
        });

        it('Udp', () => {
            expect(isValidProtocol('Udp')).toEqual(true);
        });
    });

    describe('isValidLoadDistribution', () => {
        let isValidLoadDistribution = loadBalancerSettings.__get__('isValidLoadDistribution');
        
        it('undefined', () => {
            expect(isValidLoadDistribution()).toEqual(false);
        });

        it('null', () => {
            expect(isValidLoadDistribution(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidLoadDistribution('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidLoadDistribution(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidLoadDistribution(' Default ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidLoadDistribution('default')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidLoadDistribution('NOT_VALID')).toEqual(false);
        });

        it('Default', () => {
            expect(isValidLoadDistribution('Default')).toEqual(true);
        });

        it('SourceIP', () => {
            expect(isValidLoadDistribution('SourceIP')).toEqual(true);
        });

        it('SourceIPProtocol', () => {
            expect(isValidLoadDistribution('SourceIPProtocol')).toEqual(true);
        });
    });

    describe('isValidProbeProtocol', () => {
        let isValidProbeProtocol = loadBalancerSettings.__get__('isValidProbeProtocol');
        
        it('undefined', () => {
            expect(isValidProbeProtocol()).toEqual(false);
        });

        it('null', () => {
            expect(isValidProbeProtocol(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidProbeProtocol('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidProbeProtocol(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidProbeProtocol(' Public ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidProbeProtocol('public')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidProbeProtocol('NOT_VALID')).toEqual(false);
        });

        it('Http', () => {
            expect(isValidProbeProtocol('Http')).toEqual(true);
        });

        it('Tcp', () => {
            expect(isValidProbeProtocol('Tcp')).toEqual(true);
        });
    });
});