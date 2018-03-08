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
    },
    companyDetails: {
        summary: ['co_id', 'co_name', 'co_name', 'co_diff_hourly_mean', 'co_diff_hourly_median', 'co_female_lower_band',
        'co_female_middle_band', 'co_female_upper_band', 'co_female_upper_quartile', 'co_public', 'pc_female'],
        detail: ['co_address_csv', 'co_diff_bonus_mean', 'co_diff_bonus_median', 'co_male_median_bonus', 'co_female_median_bonus', 
        'co_link', 'sic_industry', 'sic_section', 'sic_group', 'sic_division', 'sic_code'],
        prefixes: {
            co: 'company',
            sic: 'sic',
            pc: 'co_director_count'
        }
    }
}