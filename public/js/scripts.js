$(document).ready(function() {
    
    // Fixed menu on scroll
    var mainNavHeight = $('.navigation').innerHeight();
    var mainNavOffset = $('.navigation').offset();
    var realDistance = mainNavOffset.top + mainNavHeight;
    
    $(window).scroll(function() {
            var scroll = $(window).scrollTop();
            if(scroll > realDistance) {
                $('.navigation').addClass('fixed-top').removeClass('mt-4');
                $('body').css({'margin-top' : mainNavHeight+'px'});
            } else {
                $('.navigation').removeClass('fixed-top').addClass('mt-4');
                $('body').css({'margin-top' : '0px'});
            }
    });
    
    $('#contact_form').on('submit', function(event){
        
        event.preventDefault();
        
        var errors = [];
        // Validates the Name Input Field
        var name = $('#name').val();
        var nameField = $('#name');
        var nameDiv = nameField.parent();
        if(name.length < 3) {
            nameField.addClass('form-control-danger');
            nameDiv.addClass('has-danger').find('small').html('Error!');
            nameDiv.find('label').addClass('col-form-label');
            errors.push("1");
        } else {
            nameField.addClass('form-control-success').removeClass('form-control-danger');
            nameDiv.addClass('has-success').removeClass('has-danger').find('small').html('Valid!');
            nameDiv.find('label').addClass('col-form-label');
        }
        
        // Validates the Email Input Field
        var email = $('#email').val();
        var emailField = $('#email');
        var emailDiv = emailField.parent();
        if(email.length < 3) {
            emailField.addClass('form-control-danger');
            emailDiv.addClass('has-danger').find('small').html('Error!');
            emailDiv.find('label').addClass('col-form-label');
            errors.push("2");
        } else {
            emailField.addClass('form-control-success').removeClass('form-control-danger');
            emailDiv.addClass('has-success').removeClass('has-danger').find('small').html('Valid!');
            emailDiv.find('label').addClass('col-form-label');
        }
        
        // Validate the Message field
        var message = $('#message').val();
        var messageField = $('#message');
        var messageDiv = messageField.parent();
        if(message.length < 3) {
            messageField.addClass('form-control-danger');
            messageDiv.addClass('has-danger').find('small').html('Error!');
            messageDiv.find('label').addClass('col-form-label');
            errors.push("3");
        } else {
            messageField.addClass('form-control-success').removeClass('form-control-danger');
            messageDiv.addClass('has-success').removeClass('has-danger').find('small').html('Valid!');
            messageDiv.find('label').addClass('col-form-label');
        }
        
        var contact_form = $('#contact_form');
        if(!errors.length > 0 ) {
            $.ajax({
                type: contact_form.attr('method'),
                url: contact_form.attr('action'),
                data: contact_form.serialize()
            }).done(function(data) {
                var result = data;
                var response = JSON.parse(result);
                $('#output').append(response.message).addClass('d-block').fadeIn();
            });
        } 
        
        
        
        
    });
});