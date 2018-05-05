class Tooltipper {
    //Class to periodoically set tooltips on anything in the DOM
    //Runs at a set interval, looks for anything with the attribute data-tooltip and sets the the matching tooltip
    //This is a fairly inefficient method, tooltiping wasn't considered until the end of the project
    constructor() {
        this.tooltips = {
            meanGap: {
                name: '% Mean Pay Gap',
                explain: 'The mean pay for all females and all males, express as a % male mean pay. \
                A negative number indicates mean pay for women is higher than for men.',
                source: {
                    title: 'UK Gender Pay Gap Reporting 2017/8',
                    url: 'https://gender-pay-gap.service.gov.uk/Viewing/search-results'
                }
            },
            medianGap: {
                name: '% Median Pay Gap',
                explain: 'The difference between the median pay for all females and all males, express as a % male median pay. \
                A negative number indicates median pay for women is higher than for men.',
                source: {
                    title: 'UK Gender Pay Gap Reporting 2017/8',
                    url: 'https://gender-pay-gap.service.gov.uk/Viewing/search-results'
                }
            },
            bonusMeanGap: {
                name: '% Mean Bonus Pay Gap',
                explain: 'The difference between the mean bonus paid to all females and all males, expressed as a % of male mean bonus pay. \
                A negative number indicates mean bonus pay for women is higher than for men.',
                source: {
                    title: 'UK Gender Pay Gap Reporting 2017/8',
                    url: 'https://gender-pay-gap.service.gov.uk/Viewing/search-results'
                }
            },
            bonusMedianGap: {
                name: '% Median Bonus Pay Gap',
                explain: 'The difference between the median bonus paid to all females and all males, expressed as a % of male mean bonus pay. \
                A negative number indicates median bonus pay for women is higher than for men.',
                source: {
                    title: 'UK Gender Pay Gap Reporting 2017/8',
                    url: 'https://gender-pay-gap.service.gov.uk/Viewing/search-results'
                }
            },
            workforceFemale: {
                name: '% Workforce Female',
                explain: 'The percentage of the workforce which is female',
                source: {
                    title: 'UK Gender Pay Gap Reporting 2017/8',
                    url: 'https://gender-pay-gap.service.gov.uk/Viewing/search-results'
                }
            },
            directorRatio: {
                name: '% Female Directors',
                explain: 'The pecentage of directors of the company who are female. \
                When the service could not estimate gender for a director, no data is presented for that company.',
                source: {
                    title: 'Companies House',
                    url: 'https://www.gov.uk/government/organisations/companies-house'
                }
            },
            quartileSkew: {
                name: 'Quartile Skew',
                explain: 'Shows which pay quartiles tend to have more women. \
                Positive values indicate women tend to be in the lower payer quartiles. A higher number means a more pronounced skew. \
                Negative values indicate women in this company tend to be in the upper quartiles.',
                source: {
                    title: 'Companies House',
                    url: 'https://www.gov.uk/government/organisations/companies-house'
                }
            },
            meanPay: {
                name: 'Mean Weekly Sector Pay',
                explain: 'The mean weekly pay for people in this industrial group',
            }
        }
        this.tooltips.meanBonusGap = this.tooltips.bonusMeanGap
        this.tooltips.medianBonusGap = this.tooltips.bonusMedianGap
    }

    tooltip(el) {
        if(!$(el).data('ui-tooltip')) {
            const text = this.tooltips[$(el).data('tooltip')].explain
            $(el).attr('title', text)
            $(el).tooltip()
        }
    }
}