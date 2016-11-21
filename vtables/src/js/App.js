(function () {
    'use strict';

    var reportSetup = new ReportSetup();

    switch (reportSetup.getArg('report')) {
        case 'app-lifecycle':
            var report = new ReportApplicationLifecycle(reportSetup, 'Application');
            break;
    
    
    
        case 'test':
            break;
        case 'app-portfolio':
            var report = new ReportApplicationPortfolio(reportSetup, 'Application');
            break;
        case 'data-quality':
            var report = new ReportDataQuality(reportSetup, 'Application');
            break;



        case 'vf1':
            var report = new ReportApplicationLifecycle(reportSetup, 'Application');
            break;
        case 'vf2':
            var report = new ReportApplicationPortfolio(reportSetup, 'Application');
            break;
        case 'vf3':
            var report = new ReportDataQuality(reportSetup);
            break;
        case 'app-portfolio':
            var report = new ReportApplicationPortfolio(reportSetup);
            break;
        case 'process-spend':
            var report = new ReportProcessSpend(reportSetup);
            break;
        case 'capability-definitions':
            var report = new ReportHierarchy(reportSetup);
            break;
        case 'capability-definitions-cobra':
            var report = new ReportHierarchy(reportSetup, 'COBRA');
            break;
        case 'capability-definitions-bca':
            var report = new ReportHierarchy(reportSetup, 'BCA');
            break;
        case 'capability-spend-cobra':
            var report = new ReportCapabilitySpend(reportSetup, 'COBRA');
            break;
        case 'capability-spend-bca':
            var report = new ReportCapabilitySpend(reportSetup, 'BCA');
            break;
        case 'data-quality-services':
            var report = new ReportDataQualityServices(reportSetup);
            break;
        case 'capability-spend':
        default:
            var report = new ReportCapabilitySpend(reportSetup);
    }

    if (report)
        report.render();

})();