<?php

use App\Http\Controllers\ArchiveController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\TwoFactorChallengeController;
use App\Http\Controllers\AutolocMatchingController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ClientVolumeController;
use App\Http\Controllers\CommandController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeadlineController;
use App\Http\Controllers\DesignSystemController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\GenericEntityController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ManipulationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PdfTemplateController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProfileSwitchController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\RecapController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SecurityController;
use App\Http\Controllers\SubRentalController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VehicleAmortizationController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\VehicleInstallmentController;
use App\Http\Controllers\WadiSyncController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
    Route::get('/forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');
    Route::get('/reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('/reset-password', [NewPasswordController::class, 'store'])->name('password.store');
    Route::get('/two-factor-challenge', [TwoFactorChallengeController::class, 'create'])->name('two-factor.challenge');
    Route::post('/two-factor-challenge', [TwoFactorChallengeController::class, 'store'])->name('two-factor.challenge.store');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');
    Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('admin')->name('dashboard');
    Route::redirect('/', '/contracts?view=returns')->name('home');
    Route::get('/search', [SearchController::class, 'index'])->name('search');
    Route::get('/command-search', [CommandController::class, 'index'])->name('command.search');
    Route::get('/manipulation', [ManipulationController::class, 'index'])->name('manipulation.index');
    Route::middleware('permission:deadlines,view')->group(function () {
        Route::get('/deadlines', [DeadlineController::class, 'index'])->name('deadlines.index');
        Route::post('/deadlines', [DeadlineController::class, 'store'])->middleware('permission:deadlines,create')->name('deadlines.store');
        Route::post('/deadlines/{deadline}/complete', [DeadlineController::class, 'complete'])->middleware('permission:deadlines,update')->name('deadlines.complete');
    });
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/recap', [RecapController::class, 'index'])->name('recap.index');
    Route::get('/reports', [ReportController::class, 'index'])->middleware('admin')->name('reports.index');
    Route::get('/billing', [BillingController::class, 'index'])->name('billing.index');
    Route::get('/billing/versions', [BillingController::class, 'versions'])->name('billing.versions');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'read'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::get('/exports', [ExportController::class, 'index'])->name('exports.index');
    Route::get('/exports/{entity}.csv', [ExportController::class, 'csv'])->name('exports.csv');

    Route::middleware('permission:slv_contrats,view')->group(function () {
        Route::get('/contracts', [ContractController::class, 'index'])->name('contracts.index');
        Route::get('/contracts/create', [ContractController::class, 'create'])->name('contracts.create');
        Route::post('/contracts', [ContractController::class, 'store'])->middleware('permission:slv_contrats,create')->name('contracts.store');
        Route::get('/contracts/{contract}', [ContractController::class, 'show'])->name('contracts.show');
        Route::get('/contracts/{contract}/edit', [ContractController::class, 'edit'])->name('contracts.edit');
        Route::put('/contracts/{contract}', [ContractController::class, 'update'])->middleware('permission:slv_contrats,update')->name('contracts.update');
        Route::post('/contracts/{contract}/duplicate', [ContractController::class, 'duplicate'])->middleware('permission:slv_contrats,create')->name('contracts.duplicate');
        Route::post('/contracts/{contract}/return', [ContractController::class, 'returnContract'])->name('contracts.return');
        Route::delete('/contracts/{contract}', [ContractController::class, 'destroy'])->middleware('permission:slv_contrats,delete')->name('contracts.destroy');
        Route::get('/contracts/{contract}/pdf', [ContractController::class, 'pdf'])->name('contracts.pdf');
    });

    Route::middleware('permission:slv_locataires,view')->group(function () {
        Route::get('/clients', [ClientController::class, 'index'])->name('clients.index');
        Route::get('/clients/search', [ClientController::class, 'search'])->name('clients.search');
        Route::get('/clients/matching', [AutolocMatchingController::class, 'index'])->name('clients.autoloc-matching');
        Route::post('/clients/matching/{candidate}/link', [AutolocMatchingController::class, 'link'])->name('clients.autoloc-matching.link');
        Route::post('/clients/matching/{candidate}/create', [AutolocMatchingController::class, 'createClient'])->name('clients.autoloc-matching.create');
        Route::post('/clients/matching/{candidate}/ignore', [AutolocMatchingController::class, 'ignore'])->name('clients.autoloc-matching.ignore');
        Route::get('/clients/create', [ClientController::class, 'create'])->name('clients.create');
        Route::post('/clients', [ClientController::class, 'store'])->middleware('permission:slv_locataires,create')->name('clients.store');
        Route::get('/clients/{client}', [ClientController::class, 'show'])->name('clients.show');
        Route::get('/clients/{client}/edit', [ClientController::class, 'edit'])->name('clients.edit');
        Route::put('/clients/{client}', [ClientController::class, 'update'])->middleware('permission:slv_locataires,update')->name('clients.update');
        Route::delete('/clients/{client}', [ClientController::class, 'destroy'])->middleware('permission:slv_locataires,delete')->name('clients.destroy');
    });

    Route::middleware('permission:vehicle_amortizations,view')->group(function () {
        Route::get('/vehicle-amortizations', [VehicleAmortizationController::class, 'index'])->name('vehicle-amortizations.index');
        Route::get('/vehicle-amortizations/{amortization}', [VehicleAmortizationController::class, 'show'])->whereNumber('amortization')->name('vehicle-amortizations.show');
        Route::put('/vehicle-amortizations/{amortization}', [VehicleAmortizationController::class, 'update'])->whereNumber('amortization')->middleware('permission:vehicle_amortizations,update')->name('vehicle-amortizations.update');
    });

    Route::middleware('permission:sub_rentals,view')->group(function () {
        Route::get('/sub-rentals', [SubRentalController::class, 'index'])->name('sub-rentals.index');
        Route::get('/sub-rentals/{subRental}', [SubRentalController::class, 'show'])->whereNumber('subRental')->name('sub-rentals.show');
        Route::put('/sub-rentals/{subRental}', [SubRentalController::class, 'update'])->whereNumber('subRental')->middleware('permission:sub_rentals,update')->name('sub-rentals.update');
    });

    Route::middleware('permission:slv_vehicules,view')->group(function () {
        Route::get('/vehicles', [VehicleController::class, 'index'])->name('vehicles.index');
        Route::get('/vehicles/create', [VehicleController::class, 'create'])->name('vehicles.create');
        Route::post('/vehicles', [VehicleController::class, 'store'])->middleware('permission:slv_vehicules,create')->name('vehicles.store');
        Route::get('/vehicles/{vehicle}', [VehicleController::class, 'show'])->name('vehicles.show');
        Route::get('/vehicles/{vehicle}/edit', [VehicleController::class, 'edit'])->name('vehicles.edit');
        Route::put('/vehicles/{vehicle}', [VehicleController::class, 'update'])->middleware('permission:slv_vehicules,update')->name('vehicles.update');
        Route::delete('/vehicles/{vehicle}', [VehicleController::class, 'destroy'])->middleware('permission:slv_vehicules,delete')->name('vehicles.destroy');
        Route::post('/vehicles/{vehicle}/archive', [VehicleController::class, 'archive'])->middleware('permission:slv_vehicules,update')->name('vehicles.archive');
    });

    Route::middleware('permission:vehicle_installments,view')->group(function () {
        Route::get('/vehicle-installments', [VehicleInstallmentController::class, 'index'])->name('vehicle-installments.index');
        Route::get('/vehicle-installments/export.csv', [VehicleInstallmentController::class, 'exportCsv'])->name('vehicle-installments.export');
        Route::get('/vehicle-installments/{installment}', [VehicleInstallmentController::class, 'show'])->whereNumber('installment')->name('vehicle-installments.show');
        Route::get('/vehicle-installment-summaries/{summary}', [VehicleInstallmentController::class, 'showSummary'])->whereNumber('summary')->name('vehicle-installment-summaries.show');
        Route::middleware('permission:vehicle_installments,create')->group(function () {
            Route::get('/vehicle-installments/create', [VehicleInstallmentController::class, 'create'])->name('vehicle-installments.create');
            Route::post('/vehicle-installments', [VehicleInstallmentController::class, 'store'])->name('vehicle-installments.store');
        });
        Route::middleware('permission:vehicle_installments,update')->group(function () {
            Route::get('/vehicle-installments/{installment}/edit', [VehicleInstallmentController::class, 'edit'])->whereNumber('installment')->name('vehicle-installments.edit');
            Route::put('/vehicle-installments/{installment}', [VehicleInstallmentController::class, 'update'])->whereNumber('installment')->name('vehicle-installments.update');
        });
    });

    Route::middleware('permission:slv_paiements,view')->group(function () {
        Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
        Route::get('/payments/create', [PaymentController::class, 'create'])->name('payments.create');
        Route::post('/payments', [PaymentController::class, 'store'])->name('payments.store');
        Route::delete('/payments/{payment}', [PaymentController::class, 'destroy'])->name('payments.destroy');
    });

    Route::middleware('permission:factures,view')->group(function () {
        Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
        Route::get('/invoices/create', [InvoiceController::class, 'create'])->name('invoices.create');
        Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
        Route::get('/invoices/{invoice}/edit', [InvoiceController::class, 'edit'])->name('invoices.edit');
        Route::put('/invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');
        Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
        Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'pdf'])->name('invoices.pdf');
        Route::get('/invoices/{invoice}/pdf/header', [InvoiceController::class, 'pdfHeader'])->name('invoices.pdf.header');
        Route::get('/invoices/{invoice}/pdf/no-header', [InvoiceController::class, 'pdfNoHeader'])->name('invoices.pdf.no-header');
        Route::get('/invoices/{invoice}/print/header', [InvoiceController::class, 'printHeader'])->name('invoices.print.header');
        Route::get('/invoices/{invoice}/print/no-header', [InvoiceController::class, 'printNoHeader'])->name('invoices.print.no-header');
    });

    Route::middleware('permission:devis,view')->group(function () {
        Route::get('/quotes', [QuoteController::class, 'index'])->name('quotes.index');
        Route::get('/quotes/create', [QuoteController::class, 'create'])->name('quotes.create');
        Route::post('/quotes', [QuoteController::class, 'store'])->name('quotes.store');
        Route::get('/quotes/{quote}', [QuoteController::class, 'show'])->name('quotes.show');
        Route::get('/quotes/{quote}/pdf', [QuoteController::class, 'pdf'])->name('quotes.pdf');
    });

    Route::get('/data/{entity}', [GenericEntityController::class, 'index'])->name('data.index');
    Route::post('/reservations/{reservation}/convert', [ReservationController::class, 'convert'])->middleware('permission:slv_reservations,update')->name('reservations.convert');
    Route::get('/data/{entity}/create', [GenericEntityController::class, 'create'])->name('data.create');
    Route::post('/data/{entity}', [GenericEntityController::class, 'store'])->name('data.store');
    Route::post('/data/{entity}/bulk-duplicate', [GenericEntityController::class, 'bulkDuplicate'])->name('data.bulk-duplicate');
    Route::post('/data/{entity}/{id}/duplicate', [GenericEntityController::class, 'duplicate'])->name('data.duplicate');
    Route::get('/data/{entity}/{id}', [GenericEntityController::class, 'show'])->name('data.show');
    Route::get('/data/{entity}/{id}/edit', [GenericEntityController::class, 'edit'])->name('data.edit');
    Route::put('/data/{entity}/{id}', [GenericEntityController::class, 'update'])->name('data.update');
    Route::delete('/data/{entity}/{id}', [GenericEntityController::class, 'destroy'])->name('data.destroy');

    Route::get('/media/{media}', [FileController::class, 'media'])->name('media.show');
    Route::get('/documents/{document}', [FileController::class, 'document'])->name('documents.show');

    Route::get('/settings/profile', [ProfileController::class, 'edit'])->name('settings.profile');
    Route::put('/settings/profile', [ProfileController::class, 'update'])->name('settings.profile.update');

    Route::post('/profile/switch', [ProfileSwitchController::class, 'switch'])->name('profile.switch');

    Route::get('/settings/security', [SecurityController::class, 'show'])->middleware('admin')->name('settings.security');
    Route::post('/settings/security/enable', [SecurityController::class, 'enable'])->middleware('admin')->name('settings.security.enable');
    Route::post('/settings/security/confirm', [SecurityController::class, 'confirm'])->middleware('admin')->name('settings.security.confirm');
    Route::post('/settings/security/disable', [SecurityController::class, 'disable'])->middleware('admin')->name('settings.security.disable');
    Route::post('/settings/security/recovery-codes', [SecurityController::class, 'regenerateRecoveryCodes'])->middleware('admin')->name('settings.security.recovery-codes');

    Route::middleware('admin')->group(function () {
        Route::get('/finance', [FinanceController::class, 'index'])->name('finance.index');
        Route::put('/settings/deadlines/rules', [DeadlineController::class, 'updateRules'])->name('settings.deadlines.rules');
        Route::get('/settings/backups', [BackupController::class, 'index'])->name('settings.backups');
        Route::post('/settings/backups/run', [BackupController::class, 'run'])->name('settings.backups.run');
        Route::get('/settings/users', [UserController::class, 'index'])->name('settings.users');
        Route::get('/settings/users/create', [UserController::class, 'create'])->name('settings.users.create');
        Route::post('/settings/users', [UserController::class, 'store'])->name('settings.users.store');
        Route::put('/settings/users/{user}', [UserController::class, 'update'])->name('settings.users.update');
        Route::post('/settings/users/{user}/deactivate', [UserController::class, 'deactivate'])->name('settings.users.deactivate');

        Route::get('/settings/pdf-templates', [PdfTemplateController::class, 'index'])->name('settings.pdf-templates');
        Route::put('/settings/pdf-templates/{type}/{id}', [PdfTemplateController::class, 'update'])->whereNumber('id')->name('settings.pdf-templates.update');
        Route::get('/settings/teams', [TeamController::class, 'index'])->name('settings.teams');
        Route::post('/settings/teams', [TeamController::class, 'store'])->name('settings.teams.store');
        Route::put('/settings/teams/{team}', [TeamController::class, 'update'])->whereNumber('team')->name('settings.teams.update');
        Route::delete('/settings/teams/{team}', [TeamController::class, 'destroy'])->whereNumber('team')->name('settings.teams.destroy');
        Route::get('/settings/roles', [RoleController::class, 'index'])->name('settings.roles');
        Route::get('/settings/roles/{role}/edit', [RoleController::class, 'edit'])->name('settings.roles.edit');
        Route::put('/settings/roles/{role}', [RoleController::class, 'update'])->name('settings.roles.update');

        Route::get('/settings/company', [CompanyController::class, 'edit'])->name('settings.company');
        Route::put('/settings/company', [CompanyController::class, 'update'])->name('settings.company.update');

        Route::get('/settings/wadi-sync', [WadiSyncController::class, 'index'])->name('settings.wadi-sync');
        Route::post('/settings/wadi-sync/run', [WadiSyncController::class, 'run'])->name('settings.wadi-sync.run');
        Route::get('/settings/import', [ImportController::class, 'index'])->name('settings.import');
        Route::post('/settings/import/preview', [ImportController::class, 'preview'])->name('settings.import.preview');
        Route::post('/settings/import', [ImportController::class, 'store'])->name('settings.import.store');
        Route::get('/settings/client-volume', [ClientVolumeController::class, 'index'])->name('settings.client-volume');
        Route::put('/settings/client-volume/reference', [ClientVolumeController::class, 'updateReference'])->name('settings.client-volume.reference');
        Route::post('/settings/client-volume/simulate', [ClientVolumeController::class, 'simulate'])->name('settings.client-volume.simulate');
        Route::post('/settings/client-volume/import', [ClientVolumeController::class, 'import'])->name('settings.client-volume.import');
        Route::get('/settings/archive', [ArchiveController::class, 'index'])->name('settings.archive');
        Route::post('/settings/archive/apply', [ArchiveController::class, 'apply'])->name('settings.archive.apply');
        Route::post('/settings/archive/restore', [ArchiveController::class, 'restore'])->name('settings.archive.restore');
        Route::post('/settings/archive/toggle', [ArchiveController::class, 'toggle'])->name('settings.archive.toggle');
        Route::get('/settings/design-system', [DesignSystemController::class, 'index'])->name('settings.design-system');
    });
});
