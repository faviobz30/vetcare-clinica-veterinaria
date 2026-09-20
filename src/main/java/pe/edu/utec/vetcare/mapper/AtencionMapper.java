package pe.edu.utec.vetcare.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pe.edu.utec.vetcare.dto.request.UpdateAtencionRequest;
import pe.edu.utec.vetcare.dto.response.AtencionResponse;
import pe.edu.utec.vetcare.entity.AtencionEntity;

@Mapper(componentModel = "spring")
public interface AtencionMapper {

    @Mapping(source = "veterinario.idVeterinario", target = "idVeterinario")
    @Mapping(source = "cita.idCita", target = "idCita")
    AtencionResponse toResponse(AtencionEntity entity);

    void updateEntity(
            UpdateAtencionRequest request,
            @MappingTarget AtencionEntity entity
    );
}