(function () {
    'use strict';

    var reportSetup = new ReportSetup();

    switch (reportSetup.getArg('report')) {
        case 'test':
            break;
        case 'app-lifecycle':
            var report = new ReportApplicationLifecycle(reportSetup);
            break;
        case 'process-spend':
            var report = new ReportProcessSpend(reportSetup);
            break;
        case 'capability-definitions':
            var report = new ReportHierarchy(reportSetup);
            break;
        case 'capability-definitions-cobra':
            var report = new ReportHierarchy(reportSetup, 'COBRA', 'Domain Definitions COBRA');
            break;
        case 'capability-spend-cobra':
            var report = new ReportCapabilitySpend(reportSetup, 'COBRA', 'Report spend by COBRA');
            break;
        case 'capability-spend-bca':
            var report = new ReportCapabilitySpend(reportSetup, 'BCA', 'Report spend by BCA');
            break;
        case 'capability-spend':
        default:
            var report = new ReportCapabilitySpend(reportSetup);
    }

    if (report)
        report.render();

})();