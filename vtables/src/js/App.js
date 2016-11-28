(function () {
    'use strict';

    var reportSetup = new ReportSetup();

    switch (reportSetup.getArg('report')) {
        case 'app-lifecycle':
            var report = new ReportApplicationLifecycle(reportSetup, 'Application');
            break;
        case 'app-portfolio':
            var report = new ReportApplicationPortfolio(reportSetup, 'Application');
            break;
        case 'cim-masterlist':
            var report = new ReportCIMMasterList(reportSetup);
            break;
        case 'csm-operations':
            var report = new ReportCSMOperations(reportSetup, 'CSM');
            break;    
        case 'data-quality':
            var report = new ReportDataQuality(reportSetup, 'Application');
            break;
    }

    if (report)
        report.render();

})();