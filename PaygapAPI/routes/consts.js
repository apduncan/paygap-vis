module.exports = {
    sicLevels: {
        industry: {
            field: 'sic_industry',
            name: 'ONS Industry Group',
            drillDown: 'division',
            drillUp: 'section',
            urlName: 'industry'
        }, 
        section: {
            field: 'sic_section',
            name: 'Section',
            drillDown: 'industry',
            drillUp: null,
            urlName: 'section'
        },
        division: {
            field: 'sic_division',
            name: 'Division',
            drillDown: 'group',
            drillUp: 'industry',
            urlName: 'division'
        },
        group: {
            field: 'sic_group',
            name: 'Group',
            drillDown: 'sic',
            drillUp: 'division',
            urlName: 'group'
        },
        sic: {
            field: 'sic_code',
            name: 'SIC Code',
            drillDown: null,
            drillUp: 'group',
            urlName: 'sic'
        }
    }
}